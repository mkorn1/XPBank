import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { generatePresignedUrl } from '../api/generatePresignedUrl';
import { finalizeUpload } from '../api/finalizeUpload';
import { uploadToS3, getImageDimensions } from '../utils/uploadToS3';
import { validateFile, validateBatch, MAX_FILES } from '../utils/validateFile';
import { UploadJob, UploadStatus } from '../types/upload';
import { useStorageQuota } from './useStorageQuota';
import { useAuth } from '@/features/auth/contexts/AuthContext';

const MAX_CONCURRENT_UPLOADS = 100;

export function useUpload() {
  const [uploadJobs, setUploadJobs] = useState<Map<string, UploadJob>>(
    new Map()
  );
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

  const uploadFile = useCallback(
    async (file: File, uploadId: string): Promise<void> => {
      if (!currentUser) throw new Error('Not authenticated');

      // Update status to UPLOADING
      setUploadJobs((prev) => {
        const updated = new Map(prev);
        const job = updated.get(uploadId);
        if (job) {
          updated.set(uploadId, { ...job, status: 'UPLOADING' });
        }
        return updated;
      });

      try {
        // 1. Generate presigned URL
        const { presignedUrl, s3Key } = await generatePresignedUrl({
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });

        // 2. Upload to S3
        await uploadToS3(presignedUrl, file, (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setUploadJobs((prev) => {
            const updated = new Map(prev);
            const job = updated.get(uploadId);
            if (job) {
              updated.set(uploadId, { ...job, progress: percent });
            }
            return updated;
          });
        });

        // 3. Get image dimensions
        let width: number | undefined;
        let height: number | undefined;
        try {
          const dimensions = await getImageDimensions(file);
          width = dimensions.width;
          height = dimensions.height;
        } catch {
          // Ignore dimension errors
        }

        // 4. Generate photo ID
        const photoId = uuidv4();

        // 5. Finalize upload
        await finalizeUpload({
          uploadId,
          photoId,
          width,
          height,
        });

        // 6. Mark as completed
        setUploadJobs((prev) => {
          const updated = new Map(prev);
          const job = updated.get(uploadId);
          if (job) {
            updated.set(uploadId, {
              ...job,
              status: 'COMPLETED',
              progress: 100,
              photoId,
              completedAt: new Date(),
            });
          }
          return updated;
        });

        // 7. Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['photos'] });
        queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
      } catch (error: any) {
        // Mark as failed
        setUploadJobs((prev) => {
          const updated = new Map(prev);
          const job = updated.get(uploadId);
          if (job) {
            updated.set(uploadId, {
              ...job,
              status: 'FAILED',
              errorMessage: error.message || 'Upload failed',
              retryCount: (job.retryCount || 0) + 1,
            });
          }
          return updated;
        });
        throw error;
      }
    },
    [currentUser, queryClient]
  );

  const uploadFiles = useCallback(
    async (files: File[]): Promise<void> => {
      if (!currentUser) throw new Error('Not authenticated');

      // Validate batch
      const batchValidation = validateBatch(files);
      if (!batchValidation.valid) {
        throw new Error(batchValidation.error);
      }

      // Validate each file
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          errors.push(validation.error || 'Invalid file');
        }
      }

      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // Check quota
      const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
      if (!checkQuota(totalSize)) {
        throw new Error(
          `Not enough storage space. Need: ${(totalSize / (1024 * 1024)).toFixed(2)} MB, Available: ${storageStats ? ((storageStats.storageQuota - storageStats.storageUsed) / (1024 * 1024)).toFixed(2) : 0} MB`
        );
      }

      // Limit to MAX_CONCURRENT_UPLOADS
      const filesToUpload = validFiles.slice(0, MAX_CONCURRENT_UPLOADS);

      // Create upload jobs
      const jobs: Map<string, UploadJob> = new Map();
      filesToUpload.forEach((file) => {
        const uploadId = uuidv4();
        jobs.set(uploadId, {
          uploadId,
          userId: currentUser.uid,
          filename: file.name,
          fileSize: file.size,
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
          const file = filesToUpload.find((f) => f.name === job.filename);
          if (!file) return Promise.resolve();
          return uploadFile(file, uploadId).catch(() => {
            // Error already handled in uploadFile
          });
        }
      );

      await Promise.all(uploadPromises);
      setIsUploading(false);
    },
    [currentUser, checkQuota, storageStats, uploadFile]
  );

  const retryUpload = useCallback(
    async (uploadId: string) => {
      const job = uploadJobs.get(uploadId);
      if (!job || job.status !== 'FAILED') return;

      // Check retry count
      if ((job.retryCount || 0) >= 3) {
        throw new Error('Maximum retry attempts reached');
      }

      // Reset job
      setUploadJobs((prev) => {
        const updated = new Map(prev);
        updated.set(uploadId, {
          ...job,
          status: 'PENDING',
          progress: 0,
          errorMessage: undefined,
        });
        return updated;
      });

      // Create a File object from the job (we'll need to store the file or re-request it)
      // For now, we'll need the user to re-select the file
      throw new Error('Retry requires re-selecting the file');
    },
    [uploadJobs]
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
  }, []);

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
    uploadFiles,
    retryUpload,
    clearCompleted,
    getOverallProgress,
    getCompletedCount,
    getFailedCount,
  };
}

