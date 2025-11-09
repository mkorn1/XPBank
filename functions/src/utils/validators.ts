export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required field: ${fieldName}`);
  }
}

export function validateString(value: any, fieldName: string): string {
  validateRequired(value, fieldName);
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  return value;
}

export function validateNumber(value: any, fieldName: string): number {
  validateRequired(value, fieldName);
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  return num;
}

export function validatePositiveNumber(value: any, fieldName: string): number {
  const num = validateNumber(value, fieldName);
  if (num <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  return num;
}

