export const MAX_FILE_SIZE = 26214400; // 25MB in bytes
export const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
export const MAX_FILES = 150;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: File): ValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large: ${file.name} (max 25MB)`,
    };
  }

  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    // Also check extension as fallback
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported format: ${file.name}`,
      };
    }
  }

  return { valid: true };
}

export function validateBatch(files: File[]): ValidationResult {
  if (files.length > MAX_FILES) {
    return {
      valid: false,
      error: `Too many files (max ${MAX_FILES})`,
    };
  }

  return { valid: true };
}

export function validateFileType(file: File): boolean {
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  return (
    ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext)
  );
}

