export type UploadStatus = 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';

export interface UploadJob {
  uploadId: string;
  userId: string;
  filename: string;
  fileSize: number;
  status: UploadStatus;
  progress: number; // 0-100
  s3Key?: string;
  photoId?: string;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
  retryCount?: number;
}

export interface GeneratePresignedUrlRequest {
  filename: string;
  fileSize: number;
  mimeType: string;
}

export interface GeneratePresignedUrlResponse {
  uploadId: string;
  presignedUrl: string;
  s3Key: string;
  expiresIn: number; // seconds
}

export interface FinalizeUploadRequest {
  uploadId: string;
  photoId: string;
  width?: number;
  height?: number;
}

export interface FinalizeUploadResponse {
  photo: {
    photoId: string;
    userId: string;
    filename: string;
    s3Key: string;
    s3Bucket: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    width?: number;
    height?: number;
  };
  storageUsed: number;
  storageQuota: number;
}

