import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { UploadDropzone } from './UploadDropzone';
import { UploadProgressList } from './UploadProgressList';
import { useUpload } from '../hooks/useUpload';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFiles?: File[];
}

export function UploadModal({ isOpen, onClose, initialFiles }: UploadModalProps) {
  const {
    uploadJobs,
    isUploading,
    uploadFiles,
    retryUpload,
    clearCompleted,
    getOverallProgress,
    getCompletedCount,
    getFailedCount,
  } = useUpload();
  const [error, setError] = useState<string | null>(null);
  const [hasProcessedInitialFiles, setHasProcessedInitialFiles] = useState(false);

  useEffect(() => {
    // Clear completed uploads after 5 seconds
    if (getCompletedCount() > 0 && !isUploading) {
      const timer = setTimeout(() => {
        clearCompleted();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [getCompletedCount, isUploading, clearCompleted]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setError(null);
    try {
      await uploadFiles(files);
    } catch (err: any) {
      setError(err.message || 'Failed to upload files');
    }
  }, [uploadFiles]);

  // Handle initial files when modal opens
  useEffect(() => {
    if (isOpen && initialFiles && initialFiles.length > 0 && !hasProcessedInitialFiles) {
      setHasProcessedInitialFiles(true);
      handleFilesSelected(initialFiles);
    }
    // Reset when modal closes
    if (!isOpen) {
      setHasProcessedInitialFiles(false);
    }
  }, [isOpen, initialFiles, hasProcessedInitialFiles, handleFilesSelected]);

  const handleRetry = async (uploadId: string) => {
    setError(null);
    try {
      await retryUpload(uploadId);
    } catch (err: any) {
      setError(err.message || 'Failed to retry upload');
    }
  };

  if (!isOpen) return null;

  const overallProgress = getOverallProgress();
  const completedCount = getCompletedCount();
  const failedCount = getFailedCount();
  const totalCount = uploadJobs.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Upload Photos
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {uploadJobs.length === 0 ? (
            <UploadDropzone
              onFilesSelected={handleFilesSelected}
              disabled={isUploading}
            />
          ) : (
            <>
              {/* Progress Summary */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      Uploading {totalCount - completedCount - failedCount}/{totalCount} photos
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {overallProgress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all duration-300"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success/Failure Summary */}
              {!isUploading && totalCount > 0 && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  {completedCount > 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ Uploaded {completedCount} photo{completedCount !== 1 ? 's' : ''} successfully
                    </p>
                  )}
                  {failedCount > 0 && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      ✗ {failedCount} upload{failedCount !== 1 ? 's' : ''} failed
                    </p>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Upload Progress List */}
              <UploadProgressList jobs={uploadJobs} onRetry={handleRetry} />

              {/* Dropzone for additional uploads */}
              {!isUploading && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <UploadDropzone
                    onFilesSelected={handleFilesSelected}
                    disabled={isUploading}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            {isUploading ? 'Uploading in background...' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
}

