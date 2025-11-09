import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Photo } from '../types/photo';
import { getPhotoUrl } from '../api/getPhotoUrl';
import { formatFileSize, formatFileSizeMB } from '../utils/formatFileSize';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PhotoDetailModalProps {
  photo: Photo | null;
  allPhotos: Photo[];
  isOpen: boolean;
  onClose: () => void;
  onDelete: (photoId: string) => void;
  onNavigate?: (photo: Photo) => void;
}

export function PhotoDetailModal({
  photo,
  allPhotos,
  isOpen,
  onClose,
  onDelete,
  onNavigate,
}: PhotoDetailModalProps) {
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (photo && isOpen) {
      setIsLoading(true);
      getPhotoUrl({ photoId: photo.photoId })
        .then((url) => {
          setPhotoUrl(url);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load photo URL:', error);
          setIsLoading(false);
        });
    }
  }, [photo, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPhotoUrl('');
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !photo) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, photo, allPhotos]);

  if (!isOpen || !photo) return null;

  const currentIndex = allPhotos.findIndex((p) => p.photoId === photo.photoId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allPhotos.length - 1;

  const handlePrevious = () => {
    if (hasPrevious && onNavigate) {
      onNavigate(allPhotos[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(allPhotos[currentIndex + 1]);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(photo.photoId);
    setShowDeleteConfirm(false);
    onClose();
  };

  // Handle Firestore Timestamp or Date
  const uploadedDate =
    photo.uploadedAt && typeof photo.uploadedAt === 'object' && 'toDate' in photo.uploadedAt
      ? (photo.uploadedAt as any).toDate()
      : photo.uploadedAt instanceof Date
      ? photo.uploadedAt
      : new Date((photo.uploadedAt as any)?.seconds * 1000 || Date.now());

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
        onClick={onClose}
      >
        <div
          className="relative w-full h-full max-w-7xl max-h-[90vh] flex"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation arrows */}
          {hasPrevious && (
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
          <div className="flex-1 flex items-center justify-center">
            {isLoading ? (
              <div className="text-white">Loading...</div>
            ) : (
              <img
                src={photoUrl}
                alt={photo.filename}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {photo.filename}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    File Size
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {formatFileSizeMB(photo.fileSize)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Upload Date
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {format(uploadedDate, 'MMM d, yyyy')} at{' '}
                    {format(uploadedDate, 'h:mm a')}
                  </p>
                </div>

                {photo.width && photo.height && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Dimensions
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {photo.width} × {photo.height}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Photo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Delete this photo?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

