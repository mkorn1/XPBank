import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorageStats } from '../api/getStorageStats';

export function useStorageQuota() {
  return useQuery({
    queryKey: ['storage-stats'],
    queryFn: getStorageStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useInvalidateStorageQuota() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
  };
}

