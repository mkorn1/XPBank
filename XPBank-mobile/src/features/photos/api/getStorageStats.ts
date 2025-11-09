import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebase';
import { StorageStats } from '../types/storage';

export async function getStorageStats(): Promise<StorageStats> {
  const getStatsFunction = httpsCallable<{}, StorageStats>(
    functions,
    'getStorageStats'
  );

  const result = await getStatsFunction();
  return result.data;
}

