import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export interface DeletePhotoRequest {
  photoId: string;
}

export interface DeletePhotoResponse {
  success: boolean;
  freedSpace: number;
  storageUsed: number;
  storageQuota: number;
}

export async function deletePhoto(
  request: DeletePhotoRequest
): Promise<DeletePhotoResponse> {
  const deleteFunction = httpsCallable<
    DeletePhotoRequest,
    DeletePhotoResponse
  >(functions, 'deletePhoto');

  const result = await deleteFunction(request);
  return result.data;
}

