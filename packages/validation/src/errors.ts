import type { ZodError } from 'zod';
import type { ApiError } from '@dayparty/core';
import { ERROR_CODES } from '@dayparty/core';

export function createApiError(code: string, message: string, fields?: Record<string, string[]>): ApiError {
  return { code, message, ...(fields ? { fields } : {}) };
}

export function fromZodError(error: ZodError): ApiError {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    if (!fields[key]) {
      fields[key] = [];
    }
    fields[key].push(issue.message);
  }

  return createApiError(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', fields);
}
