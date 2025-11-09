import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { getS3Client, getS3Bucket } from '../../utils/s3Client';
import { Photo } from '../entities/Photo';
import { StorageQuotaService } from './StorageQuotaService';

export interface UploadJobData {
  uploadId: string;
  userId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';
  progress: number;
  s3Key: string;
  createdAt: Timestamp;
  photoId?: string;
  completedAt?: Timestamp;
  errorMessage?: string;
  retryCount?: number;
}

export class PhotoStorageService {
  static async generateUploadUrl(
    userId: string,
    filename: string,
    fileSize: number,
    mimeType: string
  ): Promise<{ presignedUrl: string; s3Key: string; uploadId: string; expiresIn: number }> {
    const db = getFirestore();
    // Check quota
    const user = await StorageQuotaService.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!StorageQuotaService.checkQuotaAvailable(user, fileSize)) {
      throw {
        error: 'QUOTA_EXCEEDED',
        message: 'Storage quota exceeded',
        storageUsed: user.storageUsed,
        storageQuota: user.storageQuota,
        required: fileSize,
      };
    }

    // Generate unique IDs
    const photoId = uuidv4();
    const uploadId = uuidv4();
    const ext = filename.split('.').pop() || 'jpg';
    const s3Key = `users/${userId}/photos/${photoId}.${ext}`;

    // Generate presigned URL
    const s3Client = getS3Client();
    const s3Bucket = getS3Bucket();
    const command = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key,
      ContentType: mimeType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutes
    });

    // Create upload job
    await db.collection('uploadJobs').doc(uploadId).set({
      uploadId,
      userId,
      filename,
      fileSize,
      mimeType,
      status: 'PENDING',
      progress: 0,
      s3Key,
      createdAt: FieldValue.serverTimestamp(),
      retryCount: 0,
    });

    return {
      presignedUrl,
      s3Key,
      uploadId,
      expiresIn: 900,
    };
  }

  static async finalizeUpload(
    uploadId: string,
    photoId: string,
    userId: string,
    width?: number,
    height?: number
  ): Promise<{ photo: Photo; storageUsed: number; storageQuota: number }> {
    console.log('[PhotoStorageService.finalizeUpload] Starting with:', { uploadId, photoId, userId, width, height });
    const db = getFirestore();
    
    // Get upload job
    console.log('[PhotoStorageService.finalizeUpload] Fetching upload job:', uploadId);
    const uploadJobDoc = await db.collection('uploadJobs').doc(uploadId).get();
    if (!uploadJobDoc.exists) {
      console.error('[PhotoStorageService.finalizeUpload] Upload job not found:', uploadId);
      throw new Error('Upload job not found');
    }

    const uploadJob = uploadJobDoc.data() as UploadJobData;
    console.log('[PhotoStorageService.finalizeUpload] Upload job found:', {
      uploadId: uploadJob.uploadId,
      userId: uploadJob.userId,
      filename: uploadJob.filename,
      fileSize: uploadJob.fileSize,
      status: uploadJob.status,
    });
    
    // Verify ownership
    if (uploadJob.userId !== userId) {
      console.error('[PhotoStorageService.finalizeUpload] Ownership mismatch:', {
        uploadJobUserId: uploadJob.userId,
        requestUserId: userId,
      });
      throw new Error('Unauthorized: Upload job does not belong to user');
    }

    // Create photo document
    console.log('[PhotoStorageService.finalizeUpload] Getting S3 bucket...');
    const s3Bucket = getS3Bucket();
    console.log('[PhotoStorageService.finalizeUpload] S3 bucket:', s3Bucket);
    
    const photo: Photo = {
      photoId,
      userId,
      filename: uploadJob.filename,
      s3Key: uploadJob.s3Key,
      s3Bucket: s3Bucket,
      fileSize: uploadJob.fileSize,
      mimeType: uploadJob.mimeType,
      uploadedAt: FieldValue.serverTimestamp() as Timestamp,
      width,
      height,
    };
    console.log('[PhotoStorageService.finalizeUpload] Creating photo document:', photoId);

    await db.collection('photos').doc(photoId).set(photo);
    console.log('[PhotoStorageService.finalizeUpload] Photo document created');

    // Update upload job
    console.log('[PhotoStorageService.finalizeUpload] Updating upload job status...');
    await db.collection('uploadJobs').doc(uploadId).update({
      status: 'COMPLETED',
      photoId,
      completedAt: FieldValue.serverTimestamp(),
    });
    console.log('[PhotoStorageService.finalizeUpload] Upload job updated');

    // Reserve quota (email is optional, will be set during signup)
    console.log('[PhotoStorageService.finalizeUpload] Reserving quota:', uploadJob.fileSize, 'bytes');
    await StorageQuotaService.reserveQuota(userId, uploadJob.fileSize);
    console.log('[PhotoStorageService.finalizeUpload] Quota reserved');

    // Get updated user stats
    console.log('[PhotoStorageService.finalizeUpload] Getting user stats...');
    const user = await StorageQuotaService.getUser(userId);
    if (!user) {
      console.error('[PhotoStorageService.finalizeUpload] User not found after quota reservation:', userId);
      throw new Error('User not found');
    }
    console.log('[PhotoStorageService.finalizeUpload] User stats:', {
      storageUsed: user.storageUsed,
      storageQuota: user.storageQuota,
    });

    return {
      photo: {
        ...photo,
        uploadedAt: photo.uploadedAt as Timestamp,
      },
      storageUsed: user.storageUsed,
      storageQuota: user.storageQuota,
    };
  }

  static async deletePhoto(userId: string, photoId: string): Promise<{
    success: boolean;
    freedSpace: number;
    storageUsed: number;
    storageQuota: number;
  }> {
    const db = getFirestore();
    // Get photo
    const photoDoc = await db.collection('photos').doc(photoId).get();
    if (!photoDoc.exists) {
      throw new Error('Photo not found');
    }

    const photo = photoDoc.data() as Photo;

    // Verify ownership
    if (photo.userId !== userId) {
      throw new Error('Unauthorized: Photo does not belong to user');
    }

    // Delete from S3
    const s3Client = getS3Client();
    const s3Bucket = getS3Bucket();
    const command = new DeleteObjectCommand({
      Bucket: s3Bucket,
      Key: photo.s3Key,
    });

    await s3Client.send(command);

    // Delete from Firestore
    await db.collection('photos').doc(photoId).delete();

    // Release quota
    await StorageQuotaService.releaseQuota(userId, photo.fileSize);

    // Get updated user stats
    const user = await StorageQuotaService.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      freedSpace: photo.fileSize,
      storageUsed: user.storageUsed,
      storageQuota: user.storageQuota,
    };
  }

  static async getPhotoUrl(userId: string, photoId: string): Promise<{ url: string; expiresIn: number }> {
    const db = getFirestore();
    // Get photo
    const photoDoc = await db.collection('photos').doc(photoId).get();
    if (!photoDoc.exists) {
      throw new Error('Photo not found');
    }

    const photo = photoDoc.data() as Photo;

    // Verify ownership
    if (photo.userId !== userId) {
      throw new Error('Unauthorized: Photo does not belong to user');
    }

    // Generate presigned URL for viewing
    const s3Client = getS3Client();
    const s3Bucket = getS3Bucket();
    const command = new GetObjectCommand({
      Bucket: s3Bucket,
      Key: photo.s3Key,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return {
      url,
      expiresIn: 3600,
    };
  }
}

