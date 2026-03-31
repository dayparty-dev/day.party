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

## Build

```bash
pnpm build            # builds all packages in dependency order, then apps (via Turborepo)
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
