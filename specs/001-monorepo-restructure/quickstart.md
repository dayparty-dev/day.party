# Quickstart: day.party Monorepo

## Prerequisites

- Node.js 20+
- pnpm 10+ (`npm install -g pnpm`)
- Docker (for MongoDB)
- NativeScript CLI (`npm install -g nativescript`) — for mobile only
- Xcode 15+ (iOS) / Android SDK (Android) — for mobile only

## Setup

```bash
# Clone and install
git clone <repo-url> day.party
cd day.party
pnpm install

# Start MongoDB
docker compose up -d

# Build all packages
pnpm build
```

## Environment Variables

Create `.env` in `apps/api/`:

```env
MONGODB_URI=mongodb://dayparty:partyday@localhost:27017/dayparty?authSource=admin
JWT_SECRET=your-dev-secret-change-in-production
JWT_EXPIRATION_TIME_SECS=86400
EMAIL_MODE=dev
# EMAIL_RESEND_API_KEY=re_xxx  # only for production email
```

## Run the API

```bash
pnpm --filter @dayparty/api dev
# → http://localhost:3001
# → Health check: GET http://localhost:3001/api/health
```

## Run the Minimal Web Client

```bash
pnpm --filter @dayparty/web dev
# → http://localhost:5173
```

## Run the Mobile App

```bash
cd apps/mobile
ns run ios    # iOS simulator
ns run android  # Android emulator
```

Make sure the API is running — the mobile app connects to it.

## Run Everything (API + Web)

```bash
pnpm dev
# Starts API and web client in parallel via Turborepo
```

## Build All

```bash
pnpm build        # Build all packages + apps
pnpm clean        # Clean all dist/ and build outputs
```

## Project Structure

```
packages/core         → @dayparty/core       (types, models)
packages/domain       → @dayparty/domain     (business logic, interfaces)
packages/db           → @dayparty/db         (MongoDB repos)
packages/validation   → @dayparty/validation (Zod schemas)
packages/api-client   → @dayparty/api-client (typed HTTP client)
apps/api              → @dayparty/api        (Hono REST API)
apps/mobile           → @dayparty/mobile     (NativeScript app)
apps/web              → @dayparty/web        (minimal React client)
apps/web-legacy       → @dayparty/web-legacy (existing Next.js, reference only)
```

## Verify Setup

```bash
# 1. All packages build
pnpm build

# 2. API responds
curl http://localhost:3001/api/health

# 3. Auth flow works
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```
