import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { generatePresignedUrl } from '../api/generatePresignedUrl';
import { finalizeUpload } from '../api/finalizeUpload';
import { uploadToS3 } from '../utils/uploadToS3';
import { validateImage, validateBatch, MAX_FILES, ImageInfo } from '../utils/validateFile';
import { UploadJob, UploadStatus } from '../types/upload';
import { useStorageQuota } from './useStorageQuota';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useUploadContext } from '../contexts/UploadContext';

const MAX_CONCURRENT_UPLOADS = 150;

export interface ImagePickerResult {
  uri: string;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
  filename?: string;
}

export function useUpload() {
  const { uploadJobs, setUploadJobs, updateUploadJob } = useUploadContext();
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { data: storageStats } = useStorageQuota();

  const checkQuota = useCallback(
    (totalSize: number): boolean => {
      if (!storageStats) return false;
      return storageStats.storageUsed + totalSize <= storageStats.storageQuota;
    },
    [storageStats]
  );

  const uploadImage = useCallback(
    async (imageInfo: ImagePickerResult, uploadId: string): Promise<void> => {
      if (!currentUser) throw new Error('Not authenticated');

      // Update status to UPLOADING
      updateUploadJob(uploadId, { status: 'UPLOADING' });

      // Use backend uploadId (will be set after generatePresignedUrl)
      let actualUploadId = uploadId;

      try {
        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(imageInfo.uri);
        if (!fileInfo.exists) {
          throw new Error('File does not exist');
        }

        // Read file as base64 to get size if not provided
        let fileSize = imageInfo.fileSize;
        if (!fileSize && fileInfo.size) {
          fileSize = fileInfo.size;
        }

        // Determine filename
        const filename = imageInfo.filename || `photo_${Date.now()}.jpg`;
        
        // Determine MIME type
        const mimeType = imageInfo.mimeType || 'image/jpeg';

        // 1. Generate presigned URL (this creates the upload job in Firestore)
        const { presignedUrl, s3Key, uploadId: backendUploadId } = await generatePresignedUrl({
          filename,
          fileSize: fileSize || 0,
          mimeType,
        });

        // Use the uploadId from the backend (this matches the one in Firestore)
        actualUploadId = backendUploadId;

        // Update the local job to use the backend uploadId
        setUploadJobs((prev) => {
          const updated = new Map(prev);
          const oldJob = updated.get(uploadId);
          if (oldJob) {
            // Remove old entry and create new one with backend uploadId
            updated.delete(uploadId);
            updated.set(actualUploadId, {
              ...oldJob,
              uploadId: actualUploadId,
              status: 'UPLOADING',
            });
          }
          return updated;
        });

        // 2. Upload to S3
        await uploadToS3(presignedUrl, imageInfo.uri, mimeType, (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          updateUploadJob(actualUploadId, { progress: percent });
        });

        // 3. Get image dimensions (use provided or get from image)
        let width: number | undefined = imageInfo.width;
        let height: number | undefined = imageInfo.height;
        
        if (!width || !height) {
          try {
            const manipResult = await ImageManipulator.manipulateAsync(
              imageInfo.uri,
              [],
              { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
            );
            width = manipResult.width;
            height = manipResult.height;
          } catch {
            // Ignore dimension errors
          }
        }

        // 4. Generate photo ID
        const photoId = uuidv4();

        // 5. Finalize upload (use the backend uploadId)
        await finalizeUpload({
          uploadId: actualUploadId,
          photoId,
          width,
          height,
        });

        // 6. Mark as completed
        updateUploadJob(actualUploadId, {
          status: 'COMPLETED',
          progress: 100,
          photoId,
          completedAt: new Date(),
        });

        // 7. Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['photos'] });
        queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
      } catch (error: any) {
        // Mark as failed (use actualUploadId which may be the backend one or the original)
        const job = uploadJobs.get(actualUploadId);
        updateUploadJob(actualUploadId, {
          status: 'FAILED',
          errorMessage: error.message || 'Upload failed',
          retryCount: (job?.retryCount || 0) + 1,
        });
        throw error;
      }
    },
    [currentUser, queryClient, updateUploadJob, uploadJobs, setUploadJobs]
  );

  const uploadImages = useCallback(
    async (images: ImagePickerResult[]): Promise<void> => {
      if (!currentUser) throw new Error('Not authenticated');

      // Validate batch
      const batchValidation = validateBatch(images);
      if (!batchValidation.valid) {
        throw new Error(batchValidation.error);
      }

      // Validate each image
      const validImages: ImagePickerResult[] = [];
      const errors: string[] = [];

      for (const image of images) {
        const validation = validateImage(image);
        if (validation.valid) {
          validImages.push(image);
        } else {
          errors.push(validation.error || 'Invalid file');
        }
      }

      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // Get file sizes
      const imagesWithSizes = await Promise.all(
        validImages.map(async (image) => {
          if (image.fileSize) return image;
          const fileInfo = await FileSystem.getInfoAsync(image.uri);
          return {
            ...image,
            fileSize: fileInfo.size || 0,
          };
        })
      );

      // Check quota
      const totalSize = imagesWithSizes.reduce((sum, img) => sum + (img.fileSize || 0), 0);
      if (!checkQuota(totalSize)) {
        throw new Error(
          `Not enough storage space. Need: ${(totalSize / (1024 * 1024)).toFixed(2)} MB, Available: ${storageStats ? ((storageStats.storageQuota - storageStats.storageUsed) / (1024 * 1024)).toFixed(2) : 0} MB`
        );
      }

      // Limit to MAX_CONCURRENT_UPLOADS
      const imagesToUpload = imagesWithSizes.slice(0, MAX_CONCURRENT_UPLOADS);

      // Create upload jobs
      const jobs: Map<string, UploadJob> = new Map();
      imagesToUpload.forEach((image) => {
        const uploadId = uuidv4();
        jobs.set(uploadId, {
          uploadId,
          userId: currentUser.uid,
          filename: image.filename || `photo_${Date.now()}.jpg`,
          fileSize: image.fileSize || 0,
          status: 'PENDING',
          progress: 0,
          createdAt: new Date(),
          retryCount: 0,
        });
      });

      setUploadJobs((prev) => new Map([...prev, ...jobs]));
      setIsUploading(true);

      // Start uploads concurrently
      const uploadPromises = Array.from(jobs.entries()).map(
        ([uploadId, job]) => {
          const image = imagesToUpload.find((img) => 
            (img.filename || `photo_${Date.now()}.jpg`) === job.filename
          );
          if (!image) return Promise.resolve();
          return uploadImage(image, uploadId).catch(() => {
            // Error already handled in uploadImage
          });
        }
      );

      await Promise.all(uploadPromises);
      setIsUploading(false);
    },
    [currentUser, checkQuota, storageStats, uploadImage, setUploadJobs]
  );

  const clearCompleted = useCallback(() => {
    setUploadJobs((prev) => {
      const updated = new Map(prev);
      Array.from(updated.entries()).forEach(([id, job]) => {
        if (job.status === 'COMPLETED') {
          updated.delete(id);
        }
      });
      return updated;
    });
  }, [setUploadJobs]);

  const getOverallProgress = useCallback((): number => {
    if (uploadJobs.size === 0) return 0;
    const totalProgress = Array.from(uploadJobs.values()).reduce(
      (sum, job) => sum + job.progress,
      0
    );
    return Math.round(totalProgress / uploadJobs.size);
  }, [uploadJobs]);

  const getCompletedCount = useCallback((): number => {
    return Array.from(uploadJobs.values()).filter(
      (job) => job.status === 'COMPLETED'
    ).length;
  }, [uploadJobs]);

  const getFailedCount = useCallback((): number => {
    return Array.from(uploadJobs.values()).filter(
      (job) => job.status === 'FAILED'
    ).length;
  }, [uploadJobs]);

  return {
    uploadJobs: Array.from(uploadJobs.values()),
    isUploading,
    uploadImages,
    clearCompleted,
    getOverallProgress,
    getCompletedCount,
    getFailedCount,
  };
}

