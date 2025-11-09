# Deployment Guide

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase project created
3. AWS account with S3 bucket created
4. AWS IAM user with S3 permissions

## Step 1: Configure Firebase Project

1. Login to Firebase:
   ```bash
   firebase login
   ```

2. Initialize Firebase in the project (if not already done):
   ```bash
   firebase init
   ```

3. Update `.firebaserc` with your project ID:
   ```json
   {
     "projects": {
       "default": "your-project-id"
     }
   }
   ```

## Step 2: Set Up AWS S3

1. **Create S3 Bucket:**
   - Go to AWS S3 Console
   - Create a new bucket
   - Note the bucket name
   - **IMPORTANT:** Note the bucket region (shown in the bucket properties)
     - Common regions: `us-east-1`, `us-east-2`, `us-west-1`, `us-west-2`, etc.
     - The region must match in your Firebase Functions configuration

2. **Configure Bucket:**
   - Block public access: Enabled
   - Encryption: Enable server-side encryption
   - CORS configuration (for presigned URL uploads):
   
   **Important:** Go to your S3 bucket → Permissions → Cross-origin resource sharing (CORS) → Edit
   
   For development (allows all origins):
   ```json
   [
     {
       "AllowedHeaders": [
         "*"
       ],
       "AllowedMethods": [
         "GET",
         "PUT",
         "POST",
         "HEAD"
       ],
       "AllowedOrigins": [
         "*"
       ],
       "ExposeHeaders": [
         "ETag",
         "x-amz-server-side-encryption",
         "x-amz-request-id",
         "x-amz-id-2"
       ],
       "MaxAgeSeconds": 3000
     }
   ]
   ```
   
   For production (replace with your actual domain):
   ```json
   [
     {
       "AllowedHeaders": [
         "*"
       ],
       "AllowedMethods": [
         "GET",
         "PUT",
         "POST",
         "HEAD"
       ],
       "AllowedOrigins": [
         "https://your-app-domain.com",
         "https://www.your-app-domain.com"
       ],
       "ExposeHeaders": [
         "ETag",
         "x-amz-server-side-encryption",
         "x-amz-request-id",
         "x-amz-id-2"
       ],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

3. **Create IAM User:**
   - Go to AWS IAM Console
   - Create a new user (e.g., `xpbank-s3-user`)
   - Attach policy with S3 permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```
   - Create access keys and save them securely

## Step 3: Configure Environment Variables

Set Firebase Functions environment variables:

```bash
firebase functions:config:set \
  aws.s3_bucket="your-bucket-name" \
  aws.access_key_id="your-access-key-id" \
  aws.secret_access_key="your-secret-access-key" \
  aws.region="us-east-1"
```

Or use the newer secrets approach (recommended for v2 functions):

```bash
# Set each secret (you'll be prompted to enter the value)
firebase functions:secrets:set AWS_S3_BUCKET
# Enter: xpbank-photos (or your bucket name)

firebase functions:secrets:set AWS_ACCESS_KEY_ID
# Enter: your-access-key-id

firebase functions:secrets:set AWS_SECRET_ACCESS_KEY
# Enter: your-secret-access-key

firebase functions:secrets:set AWS_REGION
# Enter: us-east-1 (or your bucket's region)
```

**Important Notes:**
- These secrets are stored securely in Google Cloud Secret Manager
- They are NOT the same as `.env.local` (which is for frontend only)
- After setting secrets, you MUST redeploy functions for them to take effect
- To verify secrets are set: `firebase functions:secrets:access`

## Step 4: Install Dependencies

```bash
cd functions
npm install
```

## Step 5: Build Functions

```bash
cd functions
npm run build
```

## Step 6: Deploy Functions

```bash
# From project root
firebase deploy --only functions
```

Or deploy specific functions:
```bash
firebase deploy --only functions:getPhotos
firebase deploy --only functions:generatePresignedUrl
firebase deploy --only functions:finalizeUpload
firebase deploy --only functions:deletePhoto
firebase deploy --only functions:getStorageStats
firebase deploy --only functions:getPhotoUrl
```

## Step 7: Set Up Firestore Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only read/write their own photos
    match /photos/{photoId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Users can only read/write their own upload jobs
    match /uploadJobs/{uploadId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## Step 8: Verify Deployment

1. Check function logs:
   ```bash
   firebase functions:log
   ```

2. Test functions using Firebase Console or your frontend app

## Local Development

1. **Install Firebase Emulator Suite:**
   ```bash
   firebase init emulators
   ```

2. **Set up local environment variables (for emulator only):**
   
   **Note:** For local emulator development, create `functions/.env`:
   ```
   AWS_S3_BUCKET=xpbank-photos
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_REGION=us-east-1
   ```
   
   **Important:** 
   - This `.env` file is ONLY for local emulator testing
   - For production/deployed functions, you MUST use `firebase functions:secrets:set` (see Step 3)
   - The `.env.local` in the root directory is for the frontend (Vite), not for Firebase Functions

3. **Run emulators:**
   ```bash
   firebase emulators:start
   ```

4. **Update frontend to use emulator:**
   In your frontend code, connect to emulator:
   ```typescript
   import { connectFunctionsEmulator } from 'firebase/functions';
   
   if (import.meta.env.DEV) {
     connectFunctionsEmulator(functions, 'localhost', 5001);
   }
   ```

## Troubleshooting

### Functions not deploying
- Check Firebase CLI version: `firebase --version`
- Ensure you're logged in: `firebase login`
- Check project ID in `.firebaserc`

### S3 upload errors

#### CORS Errors (XMLHttpRequest cannot load, Preflight response not successful)
**Symptoms:**
- Console error: "XMLHttpRequest cannot load ... due to access control checks"
- Preflight response status code 500
- Upload fails immediately

**Solutions:**
1. **Verify CORS configuration is applied:**
   - Go to AWS S3 Console → Your bucket → Permissions → CORS
   - Ensure the CORS configuration JSON is properly formatted (no syntax errors)
   - Click "Save changes"

2. **Check CORS configuration format:**
   - The JSON must be valid (use the example above)
   - Ensure `AllowedMethods` includes `PUT`
   - Ensure `AllowedHeaders` includes `*` or explicitly includes `Content-Type`
   - Ensure `AllowedOrigins` includes your app's origin or `*` for development

3. **Verify bucket region matches:**
   - Go to AWS S3 Console → Your bucket → Properties → AWS Region
   - Check that this region matches the `AWS_REGION` in your Firebase Functions config
   - **Common issue:** Bucket in `us-east-1` but config set to `us-east-2` (or vice versa)
   - Update Firebase Functions config: `firebase functions:secrets:set AWS_REGION` (then redeploy)

4. **Test CORS configuration:**
   - After updating CORS, wait a few minutes for changes to propagate
   - Clear browser cache and try again
   - Check browser Network tab → look for OPTIONS request (preflight)
   - OPTIONS should return 200, not 500

5. **Common CORS issues:**
   - Missing `MaxAgeSeconds` (optional but recommended)
   - Empty `ExposeHeaders` array (should include at least some headers)
   - Incorrect JSON syntax (trailing commas, missing quotes)
   - CORS config not saved/applied to bucket

#### Region Mismatch Errors (PermanentRedirect)
**Symptoms:**
- Error: "The bucket you are attempting to access must be addressed using the specified endpoint"
- `<Code>PermanentRedirect</Code>` in error response
- Preflight returns 500 status

**Solutions:**
1. **Find your bucket's actual region:**
   - Go to AWS S3 Console → Your bucket → Properties tab
   - Look for "AWS Region" - this is your bucket's region
   - Common regions: `us-east-1`, `us-east-2`, `us-west-1`, `us-west-2`

2. **Update Firebase Functions region:**
   ```bash
   firebase functions:secrets:set AWS_REGION
   # Enter your bucket's actual region (e.g., us-east-1)
   ```

3. **Redeploy functions:**
   ```bash
   firebase deploy --only functions
   ```

4. **Verify in function logs:**
   - Check Firebase Functions logs after deployment
   - Look for "S3 Config resolved" log entry
   - Verify the `region` field matches your bucket's region

#### Other S3 upload errors
- Verify bucket name and region match exactly
- Check IAM user permissions
- Check presigned URL expiration (15 minutes)
- Verify the presigned URL is being generated correctly (check function logs)

### Authentication errors
- Ensure user is logged in on frontend
- Check Firebase Auth is enabled
- Verify Firestore security rules

### Quota errors
- Check user document exists in Firestore
- Verify `storageUsed` and `storageQuota` fields
- Check quota calculation logic

## Monitoring

1. **View function logs:**
   
   **Real-time logs (recommended):**
   ```bash
   firebase functions:log --only finalizeUpload
   ```
   
   **All logs with filtering:**
   ```bash
   # View last 50 log entries
   firebase functions:log --limit 50
   
   # View logs for specific function
   firebase functions:log --only finalizeUpload
   
   # Follow logs in real-time
   firebase functions:log --follow
   ```
   
   **View in Firebase Console (better UI):**
   - Go to https://console.firebase.google.com
   - Select your project
   - Go to Functions → Logs tab
   - Filter by function name: `finalizeUpload`
   - This shows more detailed logs with better formatting

2. **Monitor in Firebase Console:**
   - Functions tab → View logs and metrics

3. **Set up alerts:**
   - Firebase Console → Functions → Alerts

## Cost Optimization

- Use appropriate function memory/timeout settings
- Monitor S3 storage usage
- Set up lifecycle policies for old photos
- Consider CloudFront for photo delivery (future)

