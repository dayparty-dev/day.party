# Quickstart: Monorepo Restructure

**Feature**: 001-monorepo-restructure
**Date**: 2026-03-31

---

## Prerequisites

- Node.js 22+ (LTS)
- pnpm 10+
- MongoDB 6+ (local or Docker — see `docker-compose.yml`)
- For mobile: NativeScript CLI (`ns`), Xcode (iOS) or Android SDK (Android)

## Install

```bash
git clone <repo-url> && cd day.party
pnpm install          # installs all packages + apps
```

## Local database (Docker)

```bash
cp .env.example .env              # optional; API loads .env via dotenv
docker compose up -d mongodb      # or: pnpm db:up
```

Connection defaults for this stack (root user, `authSource=admin`) are in `.env.example`. Optional browser UI:

```bash
docker compose --profile tools up -d   # mongo-express on http://localhost:8081 (basic auth admin/admin)
```

Seed a dev user (`dev@day.party`), default tags, and sample tasks for **today** (skips if tasks already exist for that date):

```bash
pnpm db:seed
```

Replace today’s sample tasks: `SEED_FORCE_TASKS=1 pnpm --filter @dayparty/api seed` (after `pnpm --filter @dayparty/api build` if needed).

## Build

```bash
pnpm build            # shared packages + api/web/mobile (skips web-legacy); use pnpm build:legacy for Next reference app
```

## Development

```bash
pnpm dev              # starts all apps + packages in watch mode (via Turborepo)
```

Individual apps:

```bash
pnpm --filter @dayparty/api dev        # Hono API on http://localhost:3001
pnpm --filter @dayparty/web dev        # React web on http://localhost:5173
pnpm --filter @dayparty/mobile run ios # NativeScript iOS simulator
pnpm --filter @dayparty/mobile run android  # NativeScript Android emulator
```

## Test

```bash
pnpm test             # runs all tests workspace-wide (Vitest)
pnpm --filter @dayparty/core test      # run tests for a single package
```

## Lint

```bash
pnpm lint             # lints all packages and apps
```

## Project Layout

```
packages/
  core/           → @dayparty/core         (types, models, constants)
  domain/         → @dayparty/domain       (business logic, interfaces)
  db/             → @dayparty/db           (MongoDB implementations)
  validation/     → @dayparty/validation   (Zod schemas, error model)
  api-client/     → @dayparty/api-client   (typed fetch client)

apps/
  api/            → @dayparty/api          (Hono REST API)
  web/            → @dayparty/web          (React SPA)
  mobile/         → @dayparty/mobile       (NativeScript 9)
  web-legacy/     → legacy Next.js    (reference only)
```

## Key Development Flows

**Add a new shared type**: Edit `packages/core/src/models/`, export from `index.ts`, run `pnpm build` — all consumers see the change.

**Add a new API endpoint**: Define the route in `apps/api/src/routes/`, add Zod schema in `packages/validation/`, add client method in `packages/api-client/`.

**Add a new screen (mobile)**: Create view in `apps/mobile/src/views/`, register navigation, use `@dayparty/api-client` for data.

**Add a new screen (web)**: Create page in `apps/web/src/pages/`, add route, use `@dayparty/api-client` hook for data.
