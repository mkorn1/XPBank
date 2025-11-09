# Firebase Functions for XPBank Photo System

This directory contains the Firebase Cloud Functions backend for the photo upload and management system.

## Setup

1. **Install dependencies:**
   ```bash
   cd functions
   npm install
   ```

2. **Configure environment variables:**
   
   Set these in Firebase Functions config:
   ```bash
   firebase functions:config:set aws.s3_bucket="your-bucket-name"
   firebase functions:config:set aws.access_key_id="your-access-key"
   firebase functions:config:set aws.secret_access_key="your-secret-key"
   firebase functions:config:set aws.region="us-east-1"
   ```
   
   Or use environment variables in `.env` for local development:
   ```
   AWS_S3_BUCKET=your-bucket-name
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=us-east-1
   ```

3. **Update `.firebaserc`:**
   
   Edit `.firebaserc` in the root directory and set your Firebase project ID:
   ```json
   {
     "projects": {
       "default": "your-actual-project-id"
     }
   }
   ```

## Functions

### getPhotos
Fetches photos for the authenticated user with pagination and sorting.

**Parameters:**
- `sortBy`: 'uploadedAt' | 'filename' (default: 'uploadedAt')
- `sortOrder`: 'asc' | 'desc' (default: 'desc')
- `limit`: number (default: 24, max: 100)
- `cursor`: string (optional, for pagination)

### generatePresignedUrl
Generates a presigned URL for uploading a photo to S3.

**Parameters:**
- `filename`: string
- `fileSize`: number (bytes)
- `mimeType`: string

**Returns:**
- `uploadId`: string
- `presignedUrl`: string
- `s3Key`: string
- `expiresIn`: number (seconds)

### finalizeUpload
Finalizes an upload by creating the photo document and updating storage quota.

**Parameters:**
- `uploadId`: string
- `photoId`: string
- `width`: number (optional)
- `height`: number (optional)

### deletePhoto
Deletes a photo from S3 and Firestore, and releases storage quota.

**Parameters:**
- `photoId`: string

### getStorageStats
Gets storage statistics for the authenticated user.

**Returns:**
- `storageUsed`: number (bytes)
- `storageQuota`: number (bytes)
- `percentageUsed`: number
- `remainingStorage`: number (bytes)
- `photoCount`: number

### getPhotoUrl
Generates a presigned URL for viewing a photo.

**Parameters:**
- `photoId`: string

**Returns:**
- `url`: string
- `expiresIn`: number (seconds)

## Development

1. **Build:**
   ```bash
   npm run build
   ```

2. **Run emulator:**
   ```bash
   npm run serve
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

## AWS S3 Setup

1. Create an S3 bucket
2. Configure bucket policies:
   - Block public access
   - Enable encryption at rest
   - Set up CORS for presigned URL uploads
3. Create IAM user with S3 permissions
4. Store credentials in Firebase Functions config

## Firestore Collections

- `photos`: Photo documents
- `uploadJobs`: Upload job tracking
- `users`: User documents with storage quota

## Security

- All functions require authentication
- User can only access their own photos
- Storage quota is enforced before upload
- Presigned URLs expire after 15 minutes (upload) or 1 hour (view)

