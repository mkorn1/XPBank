import { Timestamp } from 'firebase-admin/firestore';

export interface Photo {
  photoId: string;
  userId: string;
  filename: string;
  s3Key: string;
  s3Bucket: string;
  fileSize: number; // bytes
  mimeType: string;
  uploadedAt: Timestamp;
  width?: number;
  height?: number;
}

