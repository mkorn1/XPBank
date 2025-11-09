import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { User } from '../entities/User';

export class StorageQuotaService {
  static readonly DEFAULT_QUOTA = 1073741824; // 1GB in bytes

  static checkQuotaAvailable(user: User, requiredSpace: number): boolean {
    return user.storageUsed + requiredSpace <= user.storageQuota;
  }

  static async reserveQuota(userId: string, bytes: number, email?: string): Promise<void> {
    console.log('[StorageQuotaService.reserveQuota] Starting:', { userId, bytes, email: email ? 'provided' : 'not provided' });
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    
    // Check if user document exists
    console.log('[StorageQuotaService.reserveQuota] Checking if user document exists...');
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      console.log('[StorageQuotaService.reserveQuota] User document does not exist, creating...');
      // Create user document if it doesn't exist
      const userData: any = {
        userId,
        storageUsed: bytes,
        storageQuota: StorageQuotaService.DEFAULT_QUOTA,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      // Add email if provided
      if (email) {
        userData.email = email;
      }
      await userRef.set(userData);
      console.log('[StorageQuotaService.reserveQuota] User document created with storageUsed:', bytes);
    } else {
      console.log('[StorageQuotaService.reserveQuota] User document exists, updating...');
      const currentData = userDoc.data();
      console.log('[StorageQuotaService.reserveQuota] Current storageUsed:', currentData?.storageUsed);
      // Update existing user document
      await userRef.update({
        storageUsed: FieldValue.increment(bytes),
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log('[StorageQuotaService.reserveQuota] User document updated, incremented by:', bytes);
    }
    console.log('[StorageQuotaService.reserveQuota] Completed successfully');
  }

  static async releaseQuota(userId: string, bytes: number): Promise<void> {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    
    // Check if user document exists
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      // If user doesn't exist, create with 0 storage used
      await userRef.set({
        userId,
        storageUsed: 0,
        storageQuota: StorageQuotaService.DEFAULT_QUOTA,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Update existing user document
      await userRef.update({
        storageUsed: FieldValue.increment(-bytes),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  static async getUser(userId: string): Promise<User | null> {
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }
    return { userId, ...userDoc.data() } as User;
  }
}

