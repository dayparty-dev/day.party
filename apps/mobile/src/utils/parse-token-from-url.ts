/**
 * Extract magic-link token from verify URLs (https, custom scheme, or API log line).
 */
export function parseTokenFromUrl(url: string): string | null {
  const match = /[?&]token=([^&]+)/.exec(url.trim());
  if (!match?.[1]) {
    return null;
  }
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
