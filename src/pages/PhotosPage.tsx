import { useState } from 'react';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { usePhotos } from '@/features/photos/hooks/usePhotos';
import { useDeletePhoto } from '@/features/photos/hooks/useDeletePhoto';
import { usePhotoSelection } from '@/features/photos/hooks/usePhotoSelection';
import { PhotoGrid } from '@/features/photos/components/PhotoGrid';
import { SortControls } from '@/features/photos/components/SortControls';
import { StorageIndicator } from '@/features/photos/components/StorageIndicator';
import { UploadModal } from '@/features/photos/components/UploadModal';
import { PhotoDetailModal } from '@/features/photos/components/PhotoDetailModal';
import { DeleteConfirmDialog } from '@/features/photos/components/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Photo, SortBy, SortOrder } from '@/features/photos/types/photo';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PhotosPage = () => {
  const { currentUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<SortBy>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);

  const { data: photosData } = usePhotos(sortBy, sortOrder);
  const allPhotos = photosData?.pages.flatMap((page) => page.photos) || [];

  const {
    selectedIds,
    selectedCount,
    toggleSelection,
    clearSelection,
    isSelected,
  } = usePhotoSelection();

  const deletePhotoMutation = useDeletePhoto();

  const handleSortChange = (newSortBy: SortBy, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const handleDeleteSingle = (photoId: string) => {
    setPhotosToDelete([photoId]);
    setShowDeleteConfirm(true);
  };

  const handleDeleteMultiple = () => {
    if (selectedIds.length === 0) return;
    setPhotosToDelete(selectedIds);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      // Delete all photos in parallel
      await Promise.all(
        photosToDelete.map((photoId) =>
          deletePhotoMutation.mutateAsync({ photoId })
        )
      );

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });

      // Clear selection and close modals
      clearSelection();
      setShowDeleteConfirm(false);
      setSelectedPhoto(null);
    } catch (error) {
      console.error('Failed to delete photos:', error);
    }
  };

  const handleNavigatePhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              XPBank
            </h1>
            <div className="flex items-center gap-4">
              <StorageIndicator />
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentUser?.email}
              </span>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <SortControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />

          {/* Selection Toolbar */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {selectedCount} photo{selectedCount !== 1 ? 's' : ''} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleDeleteMultiple}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>

        {/* Photo Grid */}
        <PhotoGrid
          sortBy={sortBy}
          sortOrder={sortOrder}
          onPhotoClick={handlePhotoClick}
          selectedIds={selectedIds}
          onSelect={toggleSelection}
          showCheckbox={selectedCount > 0}
          onUploadClick={() => setIsUploadModalOpen(true)}
        />
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Photo Detail Modal */}
      <PhotoDetailModal
        photo={selectedPhoto}
        allPhotos={allPhotos}
        isOpen={selectedPhoto !== null}
        onClose={() => setSelectedPhoto(null)}
        onDelete={handleDeleteSingle}
        onNavigate={handleNavigatePhoto}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        photoCount={photosToDelete.length}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setPhotosToDelete([]);
        }}
        isDeleting={deletePhotoMutation.isPending}
      />
    </div>
  );
};
