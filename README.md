# XPBank - Photo Storage Platform

A web application for uploading, viewing, and managing photos in AWS S3 with Firebase authentication.

## Tech Stack

### Frontend
- **React 18** with **TypeScript**
- **Vite** - Build tool
- **TanStack Query** - Server state management and concurrent upload handling
- **Firebase SDK** - Authentication and Firestore
- **AWS SDK v3** - S3 uploads via presigned URLs
- **Tailwind CSS v4+** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons
- **react-router-dom** - Routing

### Backend
- **Firebase Functions (Gen 2)** - Serverless API endpoints (Node.js 20, TypeScript)
- **Firebase Auth** - User authentication
- **Firestore** - Metadata database
- **AWS S3** - Photo storage

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Firebase project with Authentication and Firestore enabled
- AWS account with S3 bucket configured

### Installation

1. Install dependencies:
```bash
npm install
cd functions && npm install && cd ..
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Add your Firebase configuration to `.env`:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

4. Configure Firebase Functions secrets:
```bash
firebase functions:secrets:set AWS_S3_BUCKET
firebase functions:secrets:set AWS_REGION
firebase functions:secrets:set AWS_ACCESS_KEY_ID
firebase functions:secrets:set AWS_SECRET_ACCESS_KEY
```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Email/Password authentication
3. Create a Firestore database
4. Deploy security rules:
```bash
firebase deploy --only firestore:rules
```

### AWS S3 Setup

1. Create an S3 bucket in your preferred region (default: us-east-2)
2. Configure bucket settings:
   - Block public access
   - Enable CORS for direct uploads
   - Enable server-side encryption (SSE-S3)
3. Create IAM user with S3 permissions:
   - `s3:PutObject`
   - `s3:GetObject`
   - `s3:DeleteObject`
4. Store credentials as Firebase Functions secrets

### Development

Start the development server:
```bash
npm run dev
```

Start Firebase Functions emulator (optional):
```bash
cd functions && npm run serve
```

### Build

Build for production:
```bash
npm run build
```

Deploy to Firebase:
```bash
firebase deploy
```

## Project Structure

```
src/
├── features/
│   ├── auth/
│   │   ├── components/     # Login, Signup forms
│   │   ├── contexts/       # AuthContext
│   │   ├── hooks/          # useAuth, useAuthRedirect
│   │   └── pages/          # LoginPage, SignupPage
│   └── photos/
│       ├── api/            # API client functions
│       ├── components/     # PhotoGrid, UploadModal, etc.
│       ├── hooks/          # usePhotos, useUpload, useDeletePhoto
│       ├── types/          # TypeScript types
│       └── utils/          # Upload utilities, validators
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── ProtectedRoute.tsx  # Route protection
├── lib/
│   ├── firebase.ts         # Firebase configuration
│   └── utils.ts            # Utility functions
└── pages/
    ├── PhotosPage.tsx      # Main photos page
    └── ProfilePage.tsx     # User profile page

functions/
├── src/
│   ├── domain/            # Domain entities and services (DDD)
│   ├── slices/            # Vertical slice architecture
│   └── utils/             # Auth, S3 client, validators
└── lib/                   # Compiled JavaScript
```

## Features

### ✅ Phase 1: Authentication
- Email/password login
- Email/password signup
- User document creation in Firestore
- Protected routes
- Authentication state persistence
- Secure logout

### ✅ Phase 2: Photo Management
- **Upload**
  - Drag-and-drop interface
  - File picker
  - Support for up to 100 concurrent uploads
  - Maximum file size: 25MB
  - Supported formats: JPEG, PNG, WebP, HEIC
  - Real-time upload progress tracking
  - Upload status indicators (pending, uploading, completed, failed)
  - Retry failed uploads (up to 3 attempts)
  - Background uploads (continue navigating while uploading)
  
- **Viewing**
  - Responsive photo grid (2-6 columns)
  - Progressive loading with infinite scroll
  - Click to view full-resolution photos
  - Photo metadata display (filename, upload date, file size)
  - Sort by upload date or filename (ascending/descending)
  
- **Deletion**
  - Delete individual photos
  - Multi-select and bulk delete
  - Confirmation dialog before deletion
  - Automatic quota release on deletion

- **Storage Quota**
  - 1GB storage quota per user
  - Real-time quota display (bytes used / 1GB)
  - Visual progress bar with percentage
  - Quota validation before upload
  - Error messages when quota exceeded

### ✅ Phase 3: Navigation
- Profile page with user information
- Navigation between Photos and Profile pages
- Storage quota indicator in header
- Responsive header with user email and logout

## Architecture

### Domain-Driven Design (DDD)
- Core domain entities: `User`, `Photo`, `UploadJob`
- Domain services: `PhotoStorageService`, `StorageQuotaService`
- Business logic encapsulated in domain layer

### CQRS (Command Query Responsibility Segregation)
- Commands: Upload, Delete operations
- Queries: Get photos, Get storage stats
- Separate handlers for reads and writes

### Vertical Slice Architecture
- Features organized as self-contained slices
- Each slice includes: API endpoint, business logic, validation
- Slices: `upload/`, `photos/`, `delete/`, `storage/`

## API Endpoints

All endpoints require Firebase Auth token authentication.

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
- Input validation on all API endpoints

## Performance

- Supports 100 concurrent photo uploads per user session
- Real-time upload progress updates
- Infinite query pagination for efficient photo loading
- Optimistic UI updates with TanStack Query

## License

MIT

