import { useState } from 'react';
import { usePhotos } from '@/features/photos/hooks/usePhotos';
import { useDeletePhoto } from '@/features/photos/hooks/useDeletePhoto';
import { usePhotoSelection } from '@/features/photos/hooks/usePhotoSelection';
import { PhotoGrid } from '@/features/photos/components/PhotoGrid';
import { SortControls } from '@/features/photos/components/SortControls';
import { UploadModal } from '@/features/photos/components/UploadModal';
import { PhotoDetailModal } from '@/features/photos/components/PhotoDetailModal';
import { DeleteConfirmDialog } from '@/features/photos/components/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Photo, SortBy, SortOrder } from '@/features/photos/types/photo';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, X, CheckSquare } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';

export const PhotosPage = () => {
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
    selectAll,
  } = usePhotoSelection();

  const deletePhotoMutation = useDeletePhoto();
  const [initialUploadFiles, setInitialUploadFiles] = useState<File[] | undefined>();

  const handleSortChange = (newSortBy: SortBy, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleFilesSelected = (files: File[]) => {
    setInitialUploadFiles(files);
    setIsUploadModalOpen(true);
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

  const handleSelectAll = () => {
    selectAll(allPhotos);
  };

  const someSelected = selectedCount > 0 && selectedCount < allPhotos.length;

  return (
    <AppLayout onUploadClick={() => setIsUploadModalOpen(true)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
            />
            
            {/* Select All Button - Show when no photos selected or when some (but not all) are selected */}
            {allPhotos.length > 0 && (selectedCount === 0 || someSelected) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                Select All
              </Button>
            )}
          </div>

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
        onFilesSelected={handleFilesSelected}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setInitialUploadFiles(undefined);
        }}
        initialFiles={initialUploadFiles}
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
    </AppLayout>
  );
};
