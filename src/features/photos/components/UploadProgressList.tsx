import { UploadJob } from '../types/upload';
import { UploadProgressItem } from './UploadProgressItem';

interface UploadProgressListProps {
  jobs: UploadJob[];
  onRetry?: (uploadId: string) => void;
}

export function UploadProgressList({
  jobs,
  onRetry,
}: UploadProgressListProps) {
  if (jobs.length === 0) return null;

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {jobs.map((job) => (
        <UploadProgressItem key={job.uploadId} job={job} onRetry={onRetry} />
      ))}
    </div>
  );
}

