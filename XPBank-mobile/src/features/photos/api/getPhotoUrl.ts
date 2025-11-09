import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebase';

export interface GetPhotoUrlRequest {
  photoId: string;
}

export interface GetPhotoUrlResponse {
  url: string;
  expiresIn: number;
}

export async function getPhotoUrl(
  request: GetPhotoUrlRequest
): Promise<string> {
  const getUrlFunction = httpsCallable<
    GetPhotoUrlRequest,
    GetPhotoUrlResponse
  >(functions, 'getPhotoUrl');

  const result = await getUrlFunction(request);
  return result.data.url;
}

