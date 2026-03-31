import type { ApiError } from '@dayparty/core';
import { ERROR_CODES } from '@dayparty/core';
import { createApiError, fromZodError } from '@dayparty/validation';
import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';
import type { ApiVariables } from '../types.js';

type ApiHono = Hono<{ Variables: ApiVariables }>;

function isApiErrorShape(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as ApiError).code === 'string' &&
    typeof (value as ApiError).message === 'string'
  );
}

/** Maps ERROR_CODES to HTTP status for thrown ApiError-like values */
function statusForErrorCode(code: string): ContentfulStatusCode {
  switch (code) {
    case ERROR_CODES.UNAUTHORIZED:
      return 401;
    case ERROR_CODES.FORBIDDEN:
      return 403;
    case ERROR_CODES.NOT_FOUND:
      return 404;
    case ERROR_CODES.CONFLICT:
      return 409;
    case ERROR_CODES.VALIDATION_ERROR:
      return 422;
    default:
      return 500;
  }
}

export function registerErrorHandler(app: ApiHono): void {
  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return err.getResponse();
    }
    if (err instanceof ZodError) {
      return c.json(fromZodError(err), 422);
    }
    if (isApiErrorShape(err)) {
      const status = statusForErrorCode(err.code);
      const body: ApiError = {
        code: err.code,
        message: err.message,
        ...(err.fields ? { fields: err.fields } : {}),
      };
      return c.json(body, status);
    }
    console.error(err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return c.json(createApiError(ERROR_CODES.INTERNAL_ERROR, message), 500);
  });
}
