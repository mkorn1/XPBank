import { useCallback, useState } from 'react';
import { Upload, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadDropzone({
  onFilesSelected,
  disabled = false,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      onFilesSelected(files);
    },
    [disabled, onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [disabled, onFilesSelected]
  );

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
        isDragging
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4">
        {isDragging ? (
          <Upload className="w-12 h-12 text-primary-500" />
        ) : (
          <FileImage className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        )}
        <div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            {isDragging ? 'Drop photos here' : 'Drag photos here or click to browse'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            JPEG, PNG, WebP, HEIC • Max 25MB per photo
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => document.getElementById('file-input')?.click()}
          disabled={disabled}
        >
          Choose Files
        </Button>
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

