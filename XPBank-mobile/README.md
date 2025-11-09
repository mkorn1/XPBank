# XPBank Mobile

A React Native mobile application for uploading, viewing, and managing photos in AWS S3 with Firebase authentication. Built with Expo and TypeScript.

## Features

- **Authentication**: Email/password login and signup with Firebase Auth
- **Photo Upload**: Upload multiple photos using Expo Image Picker
- **Photo Viewing**: Browse photos in a responsive grid with infinite scroll
- **Photo Management**: Delete photos with confirmation
- **Storage Quota**: Real-time storage quota display (1GB per user)
- **Sorting**: Sort photos by upload date or filename (ascending/descending)

## Tech Stack

- **React Native** with **Expo** (~54.0.23)
- **TypeScript**
- **React Navigation** - Stack and Bottom Tab navigation
- **TanStack Query** - Server state management
- **Firebase SDK** - Authentication and Firestore
- **AWS SDK v3** - S3 uploads via presigned URLs
- **Expo Image Picker** - Photo selection
- **Expo File System** - File handling
- **Expo Image Manipulator** - Image processing

## Prerequisites

- Node.js 20+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS development) or Android Emulator (for Android development)
- Firebase project with Authentication and Firestore enabled
- AWS account with S3 bucket configured

## Installation

1. Install dependencies:
```bash
cd XPBank-mobile
npm install
```

2. Set up environment variables:
Create a `.env` file in the root of `XPBank-mobile`:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

3. Configure Firebase Functions (same as web app):
```bash
firebase functions:secrets:set AWS_S3_BUCKET
firebase functions:secrets:set AWS_REGION
firebase functions:secrets:set AWS_ACCESS_KEY_ID
firebase functions:secrets:set AWS_SECRET_ACCESS_KEY
```

## Development

Start the development server:
```bash
npm start
```

Run on iOS simulator:
```bash
npm run ios
```

Run on Android emulator:
```bash
npm run android
```

## Project Structure

```
src/
├── features/
│   ├── auth/
│   │   ├── contexts/     # AuthContext
│   │   └── screens/      # LoginScreen, SignupScreen
│   └── photos/
│       ├── api/          # API client functions
│       ├── hooks/        # usePhotos, useUpload, useDeletePhoto
│       ├── types/         # TypeScript types
│       ├── utils/         # Upload utilities, validators
│       └── contexts/      # UploadContext
├── screens/               # PhotosScreen, ProfileScreen
├── navigation/            # AppNavigator
└── lib/
    └── firebase.ts        # Firebase configuration
```

## Features

### Authentication
- Email/password login
- Email/password signup
- User document creation in Firestore
- Authentication state persistence with AsyncStorage
- Secure logout

### Photo Management
- **Upload**
  - Multiple photo selection
  - Support for up to 150 concurrent uploads
  - Maximum file size: 25MB
  - Supported formats: JPEG, PNG, WebP, HEIC
  - Real-time upload progress tracking
  - Upload status indicators (pending, uploading, completed, failed)
  
- **Viewing**
  - Responsive photo grid (3 columns)
  - Progressive loading with infinite scroll
  - Tap to view full-resolution photos
  - Pull to refresh
  
- **Deletion**
  - Long press to delete individual photos
  - Confirmation dialog before deletion
  - Automatic quota release on deletion

- **Storage Quota**
  - 1GB storage quota per user
  - Real-time quota display (bytes used / 1GB)
  - Visual progress bar with percentage
  - Quota validation before upload

## API Endpoints

All endpoints require Firebase Auth token authentication (same as web app):

- `generatePresignedUrl` - Generate S3 presigned URL for upload
- `finalizeUpload` - Complete upload and create photo record
- `getPhotos` - Fetch photos with pagination and sorting
- `getPhotoUrl` - Get presigned URL for viewing photo
- `deletePhoto` - Delete photo from S3 and Firestore
- `getStorageStats` - Get user storage quota information

## Security

- All API requests authenticated via Firebase Auth tokens
- Users can only access their own photos (enforced at API level)
- S3 presigned URLs expire after 15 minutes
- S3 bucket configured with public access blocked
- HTTPS only in production

## Notes

- The mobile app reuses the same Firebase Functions backend as the web app
- Photo URLs are fetched on-demand using presigned URLs
- Upload progress is tracked in real-time
- The app uses React Navigation for routing instead of React Router

## License

MIT

