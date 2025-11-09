import { usePhotos } from '../hooks/usePhotos';
import { PhotoCard } from './PhotoCard';
import { PhotoGridSkeleton } from './PhotoGridSkeleton';
import { EmptyState } from './EmptyState';
import { Photo } from '../types/photo';
import { getPhotoUrl } from '../api/getPhotoUrl';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PhotoGridProps {
  sortBy: 'uploadedAt' | 'filename';
  sortOrder: 'asc' | 'desc';
  onPhotoClick: (photo: Photo) => void;
  selectedIds: string[];
  onSelect: (photoId: string) => void;
  showCheckbox: boolean;
  onUploadClick: () => void;
}

export function PhotoGrid({
  sortBy,
  sortOrder,
  onPhotoClick,
  selectedIds,
  onSelect,
  showCheckbox,
  onUploadClick,
}: PhotoGridProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePhotos(sortBy, sortOrder);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());

  // Load photo URLs
  useEffect(() => {
    if (!data) return;

    const loadUrls = async () => {
      const photos = data.pages.flatMap((page) => page.photos);
      const newUrls = new Map(photoUrls);

      for (const photo of photos) {
        if (!newUrls.has(photo.photoId)) {
          try {
            const url = await getPhotoUrl({ photoId: photo.photoId });
            newUrls.set(photo.photoId, url);
          } catch (error) {
            console.error(`Failed to load URL for photo ${photo.photoId}:`, error);
          }
        }
      }

      setPhotoUrls(newUrls);
    };

    loadUrls();
  }, [data]);

  if (isLoading) {
    return <PhotoGridSkeleton />;
  }

  const allPhotos = data?.pages.flatMap((page) => page.photos) || [];

  if (allPhotos.length === 0) {
    return <EmptyState onUploadClick={onUploadClick} />;
  }

  return (
    <>
      <div
        className={cn(
          'grid gap-4',
          'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
        )}
      >
        {allPhotos.map((photo) => (
          <PhotoCard
            key={photo.photoId}
            photo={photo}
            photoUrl={photoUrls.get(photo.photoId) || ''}
            isSelected={selectedIds.includes(photo.photoId)}
            onSelect={onSelect}
            onClick={onPhotoClick}
            showCheckbox={showCheckbox}
          />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            isLoading={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </>
  );
}

