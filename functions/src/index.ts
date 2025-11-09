import { initializeApp } from 'firebase-admin/app';
import { getPhotos } from './slices/photos/getPhotos';
import { getPhotoUrl } from './slices/photos/getPhotoUrl';
import { generatePresignedUrl } from './slices/upload/generatePresignedUrl';
import { finalizeUpload } from './slices/upload/finalizeUpload';
import { deletePhoto } from './slices/delete/deletePhoto';
import { getStorageStats } from './slices/storage/getStorageStats';

// Initialize Firebase Admin
initializeApp();

// Export all functions
export { getPhotos };
export { getPhotoUrl };
export { generatePresignedUrl };
export { finalizeUpload };
export { deletePhoto };
export { getStorageStats };

