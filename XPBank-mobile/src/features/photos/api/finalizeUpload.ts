import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebase';
import {
  FinalizeUploadRequest,
  FinalizeUploadResponse,
} from '../types/upload';

export async function finalizeUpload(
  request: FinalizeUploadRequest
): Promise<FinalizeUploadResponse> {
  const finalizeFunction = httpsCallable<
    FinalizeUploadRequest,
    FinalizeUploadResponse
  >(functions, 'finalizeUpload');

  const result = await finalizeFunction(request);
  return result.data;
}

