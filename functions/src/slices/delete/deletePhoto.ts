import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { verifyAuth } from '../../utils/auth';
import { PhotoStorageService } from '../../domain/services/PhotoStorageService';
import { validateString } from '../../utils/validators';

// Define secrets for v2 functions - these are set via firebase functions:secrets:set
const awsS3Bucket = defineSecret('AWS_S3_BUCKET');
const awsRegion = defineSecret('AWS_REGION');
const awsAccessKeyId = defineSecret('AWS_ACCESS_KEY_ID');
const awsSecretAccessKey = defineSecret('AWS_SECRET_ACCESS_KEY');

interface DeletePhotoRequest {
  photoId: string;
}

export const deletePhoto = onCall(
  {
    secrets: [awsS3Bucket, awsRegion, awsAccessKeyId, awsSecretAccessKey],
  },
  async (request: CallableRequest<DeletePhotoRequest>) => {
  try {
    const userId = verifyAuth(request);
    const data = request.data;

    // Validate input
    const photoId = validateString(data.photoId, 'photoId');

    const result = await PhotoStorageService.deletePhoto(userId, photoId);

    return result;
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    throw new HttpsError('internal', error.message || 'Failed to delete photo');
  }
  }
);

