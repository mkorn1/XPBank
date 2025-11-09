import { CallableRequest } from 'firebase-functions/v2/https';

export function verifyAuth(request: CallableRequest): string {
  if (!request.auth) {
    throw new Error('Unauthorized: User must be authenticated');
  }
  return request.auth.uid;
}

