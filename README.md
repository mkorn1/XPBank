# XPBank - Photo Storage Platform

A web application for uploading, viewing, and managing photos in AWS S3 with Firebase authentication.

## Tech Stack

- **React 18** with **TypeScript**
- **Vite** - Build tool
- **Firebase SDK** - Authentication and Firestore
- **Tailwind CSS v4+** - Styling
- **shadcn/ui** - UI components
- **react-router-dom** - Routing

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Firebase project with Authentication and Firestore enabled

### Installation

1. Install dependencies:
```bash
npm install
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

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Email/Password authentication
3. Create a Firestore database
4. Deploy security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Development

Start the development server:
```bash
npm run dev
```

### Build

Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── features/
│   └── auth/
│       ├── components/     # Login, Signup forms
│       ├── contexts/       # AuthContext
│       ├── hooks/          # useAuth, useAuthRedirect
│       └── pages/          # LoginPage, SignupPage
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── firebase.ts         # Firebase configuration
│   └── utils.ts            # Utility functions
└── pages/
    └── PhotosPage.tsx      # Main photos page (Phase 2)
```

## Features

### Phase 1: Authentication ✅
- Email/password login
- Email/password signup
- User document creation in Firestore
- Protected routes
- Authentication state persistence

### Phase 2: Photo Management (Coming Soon)
- Photo upload
- Photo viewing
- Photo deletion
- Storage quota management

### Phase 3: Navigation (Coming Soon)
- Profile page
- Campaigns page
- Navigation between pages

## License

MIT

