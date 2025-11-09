import { useInfiniteQuery } from '@tanstack/react-query';
import { getPhotos } from '../api/getPhotos';
import { SortBy, SortOrder } from '../types/photo';

export function usePhotos(sortBy: SortBy = 'uploadedAt', sortOrder: SortOrder = 'desc') {
  return useInfiniteQuery({
    queryKey: ['photos', { sortBy, sortOrder }],
    queryFn: ({ pageParam }) =>
      getPhotos({
        sortBy,
        sortOrder,
        limit: 24,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
  });
}

