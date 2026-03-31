# day.party

Turborepo monorepo for the day.party task rundown: shared TypeScript packages, a Hono REST API, React web SPA, NativeScript mobile app, and a preserved Next.js reference app.

## Prerequisites

- Node.js 22+ (LTS)
- pnpm 10+
- MongoDB 6+ (local or Docker — see `docker-compose.yml` if present)
- For mobile: NativeScript CLI (`ns`), Xcode (iOS) or Android SDK (Android)

## Quickstart

```bash
git clone <repo-url> && cd day.party
pnpm install
pnpm build
pnpm test
pnpm lint
```

`pnpm build` does not build `apps/web-legacy` (Next reference app). Use `pnpm build:legacy` when you need it.

Day-to-day development:

```bash
pnpm dev    # all workspaces that define a dev script (Turbo)
```

Run one app:

```bash
pnpm --filter @dayparty/api dev              # API → http://localhost:3001
pnpm --filter @dayparty/web dev              # Web → http://localhost:5173
pnpm --filter @dayparty/mobile run ios       # iOS simulator
pnpm --filter @dayparty/mobile run android   # Android emulator
```

**API + MongoDB locally:** copy [.env.example](.env.example) to `.env`, run `pnpm db:up`, then `pnpm db:seed`, then start the API (`pnpm --filter @dayparty/api dev`). Details and mongo-express profile are in [quickstart.md](specs/001-monorepo-restructure/quickstart.md).

Full step-by-step onboarding (flows, layout, filters): **[specs/001-monorepo-restructure/quickstart.md](specs/001-monorepo-restructure/quickstart.md)**.

## Project layout

| Path                         | Package / app                 | Role                                               |
| ---------------------------- | ----------------------------- | -------------------------------------------------- |
| `packages/core`              | `@dayparty/core`              | Types, models, constants                           |
| `packages/domain`            | `@dayparty/domain`            | Business logic, repository interfaces              |
| `packages/db`                | `@dayparty/db`                | MongoDB repository implementations                 |
| `packages/validation`        | `@dayparty/validation`        | Zod schemas, API error helpers                     |
| `packages/api-client`        | `@dayparty/api-client`        | Typed HTTP client for the REST API                 |
| `packages/typescript-config` | `@dayparty/typescript-config` | Shared `tsconfig` presets                          |
| `packages/eslint-config`     | `@dayparty/eslint-config`     | Shared ESLint flat config                          |
| `apps/api`                   | `@dayparty/api`               | Hono REST API                                      |
| `apps/web`                   | `@dayparty/web`               | React 19 + Vite SPA                                |
| `apps/mobile`                | `@dayparty/mobile`            | NativeScript 9                                     |
| `apps/web-legacy`            | `@dayparty/web-legacy`        | Legacy Next.js (reference only; no workspace libs) |

Also: `docs/`, `specs/` (feature specs and contracts).

## Contributing

Use `pnpm` at the repo root. Prefer shared packages under `packages/` for types and cross-cutting logic; keep `apps/` thin. Agent / automation guidelines: [AGENTS.md](AGENTS.md).
