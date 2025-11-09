import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../lib/firebase';
import { Photo, GetPhotosParams, GetPhotosResponse } from '../types/photo';

export async function getPhotos(
  params: GetPhotosParams = {}
): Promise<GetPhotosResponse> {
  const getPhotosFunction = httpsCallable<
    GetPhotosParams,
    { photos: Photo[]; nextCursor?: string; hasMore: boolean }
  >(functions, 'getPhotos');

  const result = await getPhotosFunction({
    sortBy: params.sortBy || 'uploadedAt',
    sortOrder: params.sortOrder || 'desc',
    limit: params.limit || 24,
    cursor: params.cursor,
  });

  return result.data;
}

