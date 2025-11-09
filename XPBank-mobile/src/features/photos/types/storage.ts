export interface StorageStats {
  storageUsed: number; // bytes
  storageQuota: number; // bytes (default: 1GB)
  percentageUsed: number; // 0-100
  remainingStorage: number; // bytes
  photoCount: number;
}

export interface StorageQuotaError {
  error: 'QUOTA_EXCEEDED';
  message: string;
  storageUsed: number;
  storageQuota: number;
  required: number;
}

