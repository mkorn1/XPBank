import { S3Client } from '@aws-sdk/client-s3';
import * as functions from 'firebase-functions';

// Read from Firebase Functions config (set via firebase functions:config:set)
// For v2 functions, config() may not work at runtime, so we prioritize process.env
function getAwsConfig() {
  let config: any = {};
  
  // First try process.env (set via defineString in v2 functions)
  if (process.env.AWS_S3_BUCKET || process.env.AWS_ACCESS_KEY_ID) {
    config = {
      s3_bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
      access_key_id: process.env.AWS_ACCESS_KEY_ID,
      secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
    };
    console.log('Read from process.env (v2 functions)');
    return config;
  }
  
  // Fallback to functions.config() (works in v1, may work in v2 during build)
  try {
    const funcConfig = functions.config();
    if (funcConfig && funcConfig.aws) {
      config = funcConfig.aws;
      console.log('Read from functions.config()');
      return config;
    }
  } catch (error: any) {
    console.log('functions.config() not available');
  }
  
  return config;
}

// Lazy initialization - read config when first needed (at runtime, not module load)
let s3ClientInstance: S3Client | null = null;
let s3BucketValue: string = '';

function getS3Config() {
  const awsConfig = getAwsConfig();
  // Priority: process.env (from defineSecret) > functions.config() > defaults
  // In v2 functions, defineSecret makes values available in process.env at runtime
  const bucket = process.env.AWS_S3_BUCKET || awsConfig.s3_bucket || '';
  const region = process.env.AWS_REGION || awsConfig.region || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || awsConfig.access_key_id || '';
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || awsConfig.secret_access_key || '';
  
  // Log all available env vars for debugging (without values)
  const awsEnvVars = Object.keys(process.env).filter(k => k.startsWith('AWS_'));
  console.log('S3 Config resolved:', {
    bucket: bucket || 'EMPTY',
    region,
    hasAccessKey: !!accessKeyId,
    hasSecretKey: !!secretAccessKey,
    fromEnv: !!process.env.AWS_S3_BUCKET,
    fromConfig: !!awsConfig.s3_bucket,
    awsEnvVars,
  });
  
  if (!bucket) {
    console.error('CRITICAL: S3 bucket is empty! Available env vars:', awsEnvVars);
  }
  
  return {
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
  };
}

export function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    const config = getS3Config();
    console.log('Initializing S3 Client with config:', {
      bucket: config.bucket || 'EMPTY',
      region: config.region,
      hasAccessKey: !!config.accessKeyId,
    });
    
    if (!config.bucket) {
      console.error('ERROR: AWS_S3_BUCKET is empty! Check functions.config() or environment variables.');
    }
    
    s3ClientInstance = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return s3ClientInstance;
}

export function getS3Bucket(): string {
  if (!s3BucketValue) {
    const config = getS3Config();
    s3BucketValue = config.bucket;
    if (!s3BucketValue) {
      console.error('ERROR: AWS_S3_BUCKET is empty! Check functions.config() or environment variables.');
    } else {
      console.log('S3 Bucket:', s3BucketValue);
    }
  }
  return s3BucketValue;
}

// Note: Don't call these at module load - call them inside functions at runtime
// The exported functions will be called when needed, ensuring config is available

