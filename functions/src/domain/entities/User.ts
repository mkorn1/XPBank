import { Timestamp } from 'firebase-admin/firestore';

export interface User {
  userId: string;
  email: string;
  storageUsed: number; // bytes
  storageQuota: number; // bytes (default: 1GB = 1073741824)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

