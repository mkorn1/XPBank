import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePhoto, DeletePhotoRequest } from '../api/deletePhoto';
import { useAuth } from '@/features/auth/contexts/AuthContext';

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: (request: DeletePhotoRequest) => deletePhoto(request),
    onSuccess: () => {
      // Invalidate photos queries
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      // Invalidate storage stats
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    },
  });
}

