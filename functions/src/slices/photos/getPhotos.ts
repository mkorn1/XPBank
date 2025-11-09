import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyAuth } from '../../utils/auth';

interface GetPhotosParams {
  sortBy?: 'uploadedAt' | 'filename';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

export const getPhotos = onCall(async (request: CallableRequest<GetPhotosParams>) => {
  try {
    const db = getFirestore();
    const userId = verifyAuth(request);
    const params = request.data || {};

    const sortBy = params.sortBy || 'uploadedAt';
    const sortOrder = params.sortOrder || 'desc';
    const limit = Math.min(params.limit || 24, 100);

    // Build query
    let query = db.collection('photos').where('userId', '==', userId);

    // Apply sorting
    if (sortBy === 'uploadedAt') {
      query = query.orderBy('uploadedAt', sortOrder);
    } else if (sortBy === 'filename') {
      query = query.orderBy('filename', sortOrder);
    }

    // Apply cursor for pagination
    if (params.cursor) {
      const cursorDoc = await db.collection('photos').doc(params.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    // Execute query
    const snapshot = await query.limit(limit + 1).get();

    const allDocs = snapshot.docs;
    const photos = allDocs.slice(0, limit).map((doc) => ({
      photoId: doc.id,
      ...doc.data(),
    }));

    const hasMore = allDocs.length > limit;
    const nextCursor = hasMore ? allDocs[limit].id : undefined;

    return {
      photos,
      nextCursor,
      hasMore,
    };
  } catch (error: any) {
    console.error('Error getting photos:', error);
    throw new HttpsError('internal', error.message || 'Failed to get photos');
  }
});

