import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { verifyAuth } from '../../utils/auth';
import { PhotoStorageService } from '../../domain/services/PhotoStorageService';
import { validateString, validateNumber } from '../../utils/validators';

// Define secrets for v2 functions - these are set via firebase functions:secrets:set
const awsS3Bucket = defineSecret('AWS_S3_BUCKET');
const awsRegion = defineSecret('AWS_REGION');
const awsAccessKeyId = defineSecret('AWS_ACCESS_KEY_ID');
const awsSecretAccessKey = defineSecret('AWS_SECRET_ACCESS_KEY');

interface FinalizeUploadRequest {
  uploadId: string;
  photoId: string;
  width?: number;
  height?: number;
}

export const finalizeUpload = onCall(
  {
    secrets: [awsS3Bucket, awsRegion, awsAccessKeyId, awsSecretAccessKey],
  },
  async (request: CallableRequest<FinalizeUploadRequest>) => {
  const startTime = Date.now();
  console.log('=== finalizeUpload called ===');
  console.log('Request data:', JSON.stringify(request.data, null, 2));
  
  try {
    const userId = verifyAuth(request);
    console.log('User authenticated:', userId);
    const data = request.data;

    // Validate input
    console.log('Validating input...');
    const uploadId = validateString(data.uploadId, 'uploadId');
    const photoId = validateString(data.photoId, 'photoId');
    const width = data.width !== undefined ? validateNumber(data.width, 'width') : undefined;
    const height = data.height !== undefined ? validateNumber(data.height, 'height') : undefined;
    console.log('Input validated:', { uploadId, photoId, width, height });

    console.log('Calling PhotoStorageService.finalizeUpload...');
    const result = await PhotoStorageService.finalizeUpload(
      uploadId,
      photoId,
      userId,
      width,
      height
    );
    console.log('PhotoStorageService.finalizeUpload completed successfully');

    // Convert Timestamp to ISO string for frontend
    // Handle case where uploadedAt might be a FieldValue placeholder
    let uploadedAtISO: string;
    if (result.photo.uploadedAt && typeof result.photo.uploadedAt.toDate === 'function') {
      uploadedAtISO = result.photo.uploadedAt.toDate().toISOString();
    } else {
      // Fallback to current time if Timestamp conversion fails
      uploadedAtISO = new Date().toISOString();
    }
    
    const response = {
      photo: {
        ...result.photo,
        uploadedAt: uploadedAtISO,
      },
      storageUsed: result.storageUsed,
      storageQuota: result.storageQuota,
    };
    
    const duration = Date.now() - startTime;
    console.log(`=== finalizeUpload completed successfully in ${duration}ms ===`);
    console.log('Response:', JSON.stringify(response, null, 2));
    
    return response;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`=== finalizeUpload FAILED after ${duration}ms ===`);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('Error code:', error?.code);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Provide more specific error messages
    if (error.message?.includes('not found')) {
      throw new HttpsError('not-found', error.message);
    }
    if (error.message?.includes('Unauthorized')) {
      throw new HttpsError('permission-denied', error.message);
    }
    
    throw new HttpsError('internal', error.message || 'Failed to finalize upload');
  }
  }
);

