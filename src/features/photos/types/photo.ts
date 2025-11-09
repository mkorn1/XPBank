import { Timestamp } from 'firebase/firestore';

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

export interface PhotoWithUrl extends Photo {
  url: string; // Presigned URL for viewing
}

export type SortBy = 'uploadedAt' | 'filename';
export type SortOrder = 'asc' | 'desc';

export interface GetPhotosParams {
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  limit?: number;
  cursor?: string;
}

export interface GetPhotosResponse {
  photos: Photo[];
  nextCursor?: string;
  hasMore: boolean;
}

