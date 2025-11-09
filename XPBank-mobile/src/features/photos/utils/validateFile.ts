export const MAX_FILE_SIZE = 26214400; // 25MB in bytes
export const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
];
export const MAX_FILES = 150;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImageInfo {
  uri: string;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
  filename?: string;
}

export function validateImage(imageInfo: ImageInfo): ValidationResult {
  // Check file size
  if (imageInfo.fileSize && imageInfo.fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large: ${imageInfo.filename || 'image'} (max 25MB)`,
    };
  }

  // Check MIME type
  if (imageInfo.mimeType && !ALLOWED_TYPES.includes(imageInfo.mimeType)) {
    return {
      valid: false,
      error: `Unsupported format: ${imageInfo.filename || 'image'}`,
    };
  }

  return { valid: true };
}

export function validateBatch(images: ImageInfo[]): ValidationResult {
  if (images.length > MAX_FILES) {
    return {
      valid: false,
      error: `Too many files (max ${MAX_FILES})`,
    };
  }

  return { valid: true };
}

