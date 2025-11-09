import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useUploadContext } from '@/features/photos/contexts/UploadContext';
import { StorageIndicator } from '@/features/photos/components/StorageIndicator';
import { Button } from '@/components/ui/button';
import { Upload, User, CheckCircle2, XCircle, Loader2, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatFileSize } from '@/features/photos/utils/formatFileSize';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface AppHeaderProps {
  onUploadClick?: () => void;
}

export function AppHeader({ onUploadClick }: AppHeaderProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { getActiveUploads, getCompletedUploads, getFailedUploads, getTotalProgress, getStatusSummary, clearCompleted, clearFailed } = useUploadContext();

  const activeUploads = getActiveUploads();
  const completedUploads = getCompletedUploads();
  const failedUploads = getFailedUploads();
  const progress = getTotalProgress();
  const statusSummary = getStatusSummary();
  const hasActiveUploads = activeUploads.length > 0;
  const hasCompletedUploads = completedUploads.length > 0;
  const hasFailedUploads = failedUploads.length > 0;
  const hasAnyUploads = statusSummary.total > 0;

  // Auto-clear completed uploads after 5 seconds when no active uploads
  useEffect(() => {
    if (hasCompletedUploads && !hasActiveUploads) {
      const timer = setTimeout(() => {
        clearCompleted();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedUploads, hasActiveUploads, clearCompleted]);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            XPBank
          </h1>
          <div className="flex items-center gap-4">
            {/* Upload Progress Bar with Status */}
            {hasAnyUploads && (
              <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {hasActiveUploads && (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    )}
                    {!hasActiveUploads && hasFailedUploads && (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    {!hasActiveUploads && !hasFailedUploads && hasCompletedUploads && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>

                  {/* Progress Info */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {hasActiveUploads && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            Uploading...
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {formatFileSize(progress.uploaded)} / {formatFileSize(progress.total)} ({progress.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all duration-300 bg-blue-500'
                            )}
                            style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                          />
                        </div>
                        {/* Status counts */}
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {statusSummary.uploading > 0 && (
                            <span className="flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {statusSummary.uploading} uploading
                            </span>
                          )}
                          {statusSummary.pending > 0 && (
                            <span>{statusSummary.pending} pending</span>
                          )}
                          {statusSummary.completed > 0 && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="w-3 h-3" />
                              {statusSummary.completed} complete
                            </span>
                          )}
                          {statusSummary.failed > 0 && (
                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                              <XCircle className="w-3 h-3" />
                              {statusSummary.failed} failed
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Completion Notification */}
                    {!hasActiveUploads && hasCompletedUploads && !hasFailedUploads && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          {statusSummary.completed} upload{statusSummary.completed !== 1 ? 's' : ''} completed
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearCompleted}
                          className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {/* Failure Notification */}
                    {!hasActiveUploads && hasFailedUploads && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {statusSummary.failed} upload{statusSummary.failed !== 1 ? 's' : ''} failed
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFailed}
                          className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {/* Mixed Status (completed + failed) */}
                    {!hasActiveUploads && hasCompletedUploads && hasFailedUploads && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-600 dark:text-green-400">
                          {statusSummary.completed} complete
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-red-600 dark:text-red-400">
                          {statusSummary.failed} failed
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            clearCompleted();
                            clearFailed();
                          }}
                          className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {onUploadClick && (
                    <Button
                      onClick={onUploadClick}
                      size="sm"
                      className="flex items-center gap-2 flex-shrink-0"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </Button>
                  )}
                </div>
              </div>
            )}

            {!hasAnyUploads && (
              <>
                <StorageIndicator />
                {onUploadClick && (
                  <Button
                    onClick={onUploadClick}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                )}
              </>
            )}

            <Button
              variant="ghost"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentUser?.email}
              </span>
            </Button>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

