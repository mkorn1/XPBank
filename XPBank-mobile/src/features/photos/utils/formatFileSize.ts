export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatFileSizeMB(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

export function formatStorageQuota(used: number, quota: number): string {
  const usedMB = used / (1024 * 1024);
  const quotaGB = quota / (1024 * 1024 * 1024);
  const percentage = (used / quota) * 100;

  return `${usedMB.toFixed(0)} MB / ${quotaGB.toFixed(0)} GB (${percentage.toFixed(1)}%)`;
}

