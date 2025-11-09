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

interface GetPhotoUrlRequest {
  photoId: string;
}

export const getPhotoUrl = onCall(
  {
    secrets: [awsS3Bucket, awsRegion, awsAccessKeyId, awsSecretAccessKey],
  },
  async (request: CallableRequest<GetPhotoUrlRequest>) => {
  const startTime = Date.now();
  console.log('=== getPhotoUrl called ===');
  console.log('Request data:', JSON.stringify(request.data, null, 2));
  
  // Debug: Check if secrets are available
  // In v2 functions, secrets from defineSecret are available in process.env
  // But we can also try to access them directly
  const bucketFromEnv = process.env.AWS_S3_BUCKET;
  const regionFromEnv = process.env.AWS_REGION;
  const accessKeyFromEnv = process.env.AWS_ACCESS_KEY_ID;
  const secretKeyFromEnv = process.env.AWS_SECRET_ACCESS_KEY;
  
  console.log('Environment check:', {
    hasAWS_S3_BUCKET: !!bucketFromEnv,
    hasAWS_REGION: !!regionFromEnv,
    hasAWS_ACCESS_KEY_ID: !!accessKeyFromEnv,
    hasAWS_SECRET_ACCESS_KEY: !!secretKeyFromEnv,
    bucketValue: bucketFromEnv || 'EMPTY',
    regionValue: regionFromEnv || 'EMPTY',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('AWS') || k.includes('S3')).join(', '),
  });
  
  // If bucket is still empty, this is a critical error
  if (!bucketFromEnv) {
    console.error('CRITICAL: AWS_S3_BUCKET secret is not available in process.env');
    console.error('This means the secret was not properly injected into the function');
    console.error('Verify: 1) Secret is set: firebase functions:secrets:access');
    console.error('       2) Function is configured with secrets in the onCall options');
    console.error('       3) Function was redeployed after secrets were added');
  }
  
  try {
    const userId = verifyAuth(request);
    console.log('User authenticated:', userId);
    const data = request.data;

    // Validate input
    const photoId = validateString(data.photoId, 'photoId');
    console.log('Photo ID:', photoId);

    console.log('Calling PhotoStorageService.getPhotoUrl...');
    const result = await PhotoStorageService.getPhotoUrl(userId, photoId);
    console.log('PhotoStorageService.getPhotoUrl completed successfully');

    const duration = Date.now() - startTime;
    console.log(`=== getPhotoUrl completed successfully in ${duration}ms ===`);
    
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`=== getPhotoUrl FAILED after ${duration}ms ===`);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    throw new HttpsError('internal', error.message || 'Failed to get photo URL');
  }
});

