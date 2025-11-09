import { UploadJob } from '../types/upload';
import { formatFileSize } from '../utils/formatFileSize';
import { cn } from '@/lib/utils';
import { Check, X, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadProgressItemProps {
  job: UploadJob;
  onRetry?: (uploadId: string) => void;
}

export function UploadProgressItem({ job, onRetry }: UploadProgressItemProps) {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'COMPLETED':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <X className="w-4 h-4 text-red-500" />;
      case 'UPLOADING':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'COMPLETED':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'FAILED':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'UPLOADING':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'PENDING':
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        getStatusColor()
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getStatusIcon()}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {job.filename}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(job.fileSize)}
            {job.status === 'UPLOADING' && ` • ${job.progress}%`}
          </div>
        </div>
      </div>

      {job.status === 'FAILED' && onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRetry(job.uploadId)}
          className="ml-2"
        >
          Retry
        </Button>
      )}
    </div>
  );
}

