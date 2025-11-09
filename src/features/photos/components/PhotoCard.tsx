import { useState } from 'react';
import { Photo } from '../types/photo';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface PhotoCardProps {
  photo: Photo;
  photoUrl: string;
  isSelected: boolean;
  onSelect: (photoId: string) => void;
  onClick: (photo: Photo) => void;
  showCheckbox?: boolean;
}

export function PhotoCard({
  photo,
  photoUrl,
  isSelected,
  onSelect,
  onClick,
  showCheckbox = false,
}: PhotoCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.checkbox-container')) {
      return; // Don't trigger photo click if clicking checkbox
    }
    onClick(photo);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(photo.photoId);
  };

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div
        className={cn(
          'aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800',
          'border-2 transition-all',
          isSelected
            ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
            : 'border-transparent group-hover:border-gray-300 dark:group-hover:border-gray-600'
        )}
      >
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
            <span className="text-sm">Failed to load</span>
          </div>
        ) : (
          <img
            src={photoUrl}
            alt={photo.filename}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        )}
      </div>

      {/* Checkbox */}
      {(showCheckbox || isHovered || isSelected) && (
        <div
          className="checkbox-container absolute top-2 left-2 z-10"
          onClick={handleCheckboxClick}
        >
          <div
            className={cn(
              'w-6 h-6 rounded border-2 flex items-center justify-center transition-all',
              isSelected
                ? 'bg-primary-500 border-primary-500'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 group-hover:border-primary-400'
            )}
          >
            {isSelected && (
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            )}
          </div>
        </div>
      )}

      {/* Filename on hover */}
      {isHovered && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
          {photo.filename}
        </div>
      )}
    </div>
  );
}

