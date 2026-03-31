import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const secret = () => process.env.MAGIC_LINK_SECRET ?? 'dev-magic-link-secret-change-me';

export function mintMagicLinkToken(email: string): string {
  const exp = Date.now() + 15 * 60 * 1000;
  const payload = JSON.stringify({ email, exp });
  const b64 = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = createHmac('sha256', secret()).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

export function parseMagicLinkToken(raw: string): { email: string } | null {
  const [b64, sig] = raw.split('.');
  if (!b64 || !sig) return null;
  const expected = createHmac('sha256', secret()).update(b64).digest('base64url');
  try {
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'))) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')) as {
      email?: string;
      exp?: number;
    };
    if (!payload.email || typeof payload.exp !== 'number') return null;
    if (payload.exp < Date.now()) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

export function mintBearerToken(): string {
  return randomBytes(32).toString('base64url');
}
