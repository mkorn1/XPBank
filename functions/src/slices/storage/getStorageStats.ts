import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { verifyAuth } from '../../utils/auth';
import { StorageQuotaService } from '../../domain/services/StorageQuotaService';
import { getFirestore } from 'firebase-admin/firestore';

export const getStorageStats = onCall(async (request: CallableRequest) => {
  try {
    const db = getFirestore();
    const userId = verifyAuth(request);

    // Get user
    const user = await StorageQuotaService.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Count photos
    const photosSnapshot = await db
      .collection('photos')
      .where('userId', '==', userId)
      .count()
      .get();

    const photoCount = photosSnapshot.data().count;

    // Calculate stats
    const percentageUsed = (user.storageUsed / user.storageQuota) * 100;
    const remainingStorage = user.storageQuota - user.storageUsed;

    return {
      storageUsed: user.storageUsed,
      storageQuota: user.storageQuota,
      percentageUsed: Math.round(percentageUsed * 100) / 100, // Round to 2 decimal places
      remainingStorage,
      photoCount,
    };
  } catch (error: any) {
    console.error('Error getting storage stats:', error);
    throw new HttpsError('internal', error.message || 'Failed to get storage stats');
  }
});

