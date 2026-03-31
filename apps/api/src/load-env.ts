import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load `.env` for the API: monorepo root first (where `cp .env.example .env` usually lands),
 * then `apps/api/.env` so package-local values override.
 *
 * `dotenv/config` alone only reads `cwd/.env`; pnpm runs this package with cwd `apps/api`,
 * so root `.env` was never loaded.
 */
function loadEnv(): void {
  const packageDir = path.join(__dirname, '..');
  const monorepoRoot = path.join(packageDir, '..', '..');
  const rootEnv = path.join(monorepoRoot, '.env');
  const apiEnv = path.join(packageDir, '.env');

  if (existsSync(rootEnv)) {
    config({ path: rootEnv });
  }
  if (existsSync(apiEnv)) {
    config({ path: apiEnv });
  }
}

loadEnv();
