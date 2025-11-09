import { SortBy, SortOrder } from '../types/photo';
import { cn } from '@/lib/utils';

interface SortControlsProps {
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortChange: (sortBy: SortBy, sortOrder: SortOrder) => void;
}

export function SortControls({
  sortBy,
  sortOrder,
  onSortChange,
}: SortControlsProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'newest') {
      onSortChange('uploadedAt', 'desc');
    } else if (value === 'oldest') {
      onSortChange('uploadedAt', 'asc');
    } else if (value === 'filename-asc') {
      onSortChange('filename', 'asc');
    } else if (value === 'filename-desc') {
      onSortChange('filename', 'desc');
    }
  };

  const currentValue =
    sortBy === 'uploadedAt' && sortOrder === 'desc'
      ? 'newest'
      : sortBy === 'uploadedAt' && sortOrder === 'asc'
      ? 'oldest'
      : sortBy === 'filename' && sortOrder === 'asc'
      ? 'filename-asc'
      : 'filename-desc';

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="sort-select"
        className="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Sort by:
      </label>
      <select
        id="sort-select"
        value={currentValue}
        onChange={handleChange}
        className={cn(
          'px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700',
          'rounded-md bg-white dark:bg-gray-800',
          'text-gray-900 dark:text-gray-100',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
        )}
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="filename-asc">Filename A-Z</option>
        <option value="filename-desc">Filename Z-A</option>
      </select>
    </div>
  );
}

