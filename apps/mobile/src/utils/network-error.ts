import type { ApiError } from '@dayparty/core';
import { ERROR_CODES } from '@dayparty/core';

/** True when failure is probably transport / API down (for retry UI). */
export function isLikelyNetworkFailure(error: ApiError): boolean {
  if (error.code !== ERROR_CODES.INTERNAL_ERROR) {
    return false;
  }
  const m = error.message.toLowerCase();
  return (
    m.includes('network') ||
    m.includes('failed to fetch') ||
    m.includes('fetch') ||
    m.includes('timeout') ||
    m.includes('connection') ||
    m.includes('host') ||
    m.includes('internet')
  );
}
