import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../lib/firebase';
import {
  GeneratePresignedUrlRequest,
  GeneratePresignedUrlResponse,
  StorageQuotaError,
} from '../types/upload';

export async function generatePresignedUrl(
  request: GeneratePresignedUrlRequest
): Promise<GeneratePresignedUrlResponse> {
  const generateUrlFunction = httpsCallable<
    GeneratePresignedUrlRequest,
    GeneratePresignedUrlResponse | StorageQuotaError
  >(functions, 'generatePresignedUrl');

  const result = await generateUrlFunction(request);

  // Check if it's an error response
  if ('error' in result.data && result.data.error === 'QUOTA_EXCEEDED') {
    throw new Error(result.data.message);
  }

  return result.data as GeneratePresignedUrlResponse;
}

