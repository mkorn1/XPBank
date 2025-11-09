import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { verifyAuth } from '../../utils/auth';
import { PhotoStorageService } from '../../domain/services/PhotoStorageService';
import { validateString, validatePositiveNumber } from '../../utils/validators';

// Define secrets for v2 functions - these are set via firebase functions:secrets:set
const awsS3Bucket = defineSecret('AWS_S3_BUCKET');
const awsRegion = defineSecret('AWS_REGION');
const awsAccessKeyId = defineSecret('AWS_ACCESS_KEY_ID');
const awsSecretAccessKey = defineSecret('AWS_SECRET_ACCESS_KEY');

interface GeneratePresignedUrlRequest {
  filename: string;
  fileSize: number;
  mimeType: string;
}

export const generatePresignedUrl = onCall(
  {
    secrets: [awsS3Bucket, awsRegion, awsAccessKeyId, awsSecretAccessKey],
  },
  async (request: CallableRequest<GeneratePresignedUrlRequest>) => {
  try {
    const userId = verifyAuth(request);
    const data = request.data;

    // Validate input
    const filename = validateString(data.filename, 'filename');
    const fileSize = validatePositiveNumber(data.fileSize, 'fileSize');
    const mimeType = validateString(data.mimeType, 'mimeType');

    // Validate file size (25MB max)
    const MAX_FILE_SIZE = 26214400; // 25MB
    if (fileSize > MAX_FILE_SIZE) {
      throw new HttpsError('invalid-argument', 'File size exceeds 25MB limit');
    }

    // Validate MIME type
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
    if (!ALLOWED_TYPES.includes(mimeType)) {
      throw new HttpsError('invalid-argument', 'Unsupported file type');
    }

    const result = await PhotoStorageService.generateUploadUrl(
      userId,
      filename,
      fileSize,
      mimeType
    );

    return result;
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    
    // Handle quota exceeded error
    if (error.error === 'QUOTA_EXCEEDED') {
      throw new HttpsError('resource-exhausted', error.message, error);
    }
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', error.message || 'Failed to generate upload URL');
  }
});

