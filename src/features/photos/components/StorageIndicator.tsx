import { useStorageQuota } from '../hooks/useStorageQuota';
import { formatStorageQuota } from '../utils/formatFileSize';
import { cn } from '@/lib/utils';

export function StorageIndicator() {
  const { data: stats, isLoading } = useStorageQuota();

  if (isLoading || !stats) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  const percentage = stats.percentageUsed;
  const colorClass =
    percentage >= 90
      ? 'bg-red-500'
      : percentage >= 75
      ? 'bg-yellow-500'
      : 'bg-green-500';

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-gray-700 dark:text-gray-300">
        {formatStorageQuota(stats.storageUsed, stats.storageQuota)}
      </div>
      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', colorClass)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

