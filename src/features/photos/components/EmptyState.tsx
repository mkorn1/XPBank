import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from 'lucide-react';

interface EmptyStateProps {
  onFilesSelected: (files: File[]) => void;
}

export function EmptyState({ onFilesSelected }: EmptyStateProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [onFilesSelected]
  );

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Image className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
        No photos yet
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
        Upload your first photo to get started
      </p>
      <Button onClick={handleButtonClick}>Upload Photo</Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
}

