# day.party Development Guidelines

Canonical instructions for AI coding agents in this repository.
Last updated: 2026-04-02

## Active Technologies

- TypeScript 5.x (strict mode incremental) + Turborepo, pnpm 10, Hono (`apps/api`), React 19 + Vite (`apps/web`), NativeScript 9 (`apps/mobile`), Zod (`@dayparty/validation`), MongoDB driver (`@dayparty/db`), `DayPartyClient` (`@dayparty/api-client`) (003-vision-aligned-rebuild)
- MongoDB 6 (existing); new/extended documents and collections per `data-model.md`; access via **repository ports** in `@dayparty/domain`, implementations in `@dayparty/db` (003-vision-aligned-rebuild)

- TypeScript 5.x (strict mode goal, incremental migration) + Turborepo, pnpm 10, Hono (`apps/api`), NativeScript 9 + Vite (`apps/mobile`), React 19 + Vite (`apps/web`), Zod (`@dayparty/validation`), MongoDB driver (`@dayparty/db`) (001-monorepo-restructure, 002-tidy-arch-alignment)
- MongoDB 6 (existing instance, no migration); persistence via repository ports in `@dayparty/domain` with implementations in `@dayparty/db` (002-tidy-arch-alignment)

## Project Structure

```text
packages/
  core/              @dayparty/core — types, models, constants
  domain/            @dayparty/domain — business logic, repository interfaces
  db/                @dayparty/db — MongoDB implementations
  validation/        @dayparty/validation — Zod schemas, fromZodError helpers
  api-client/        @dayparty/api-client — DayPartyClient (REST)
  typescript-config/ @dayparty/typescript-config — shared tsconfig presets
  eslint-config/     @dayparty/eslint-config — shared ESLint flat config
apps/
  api/          @dayparty/api — Hono REST API (/api/*)
  web/          @dayparty/web — React 19 + Vite SPA
  mobile/       @dayparty/mobile — NativeScript 9
  web-legacy/   @dayparty/web-legacy — Next.js reference only (no @dayparty/* deps)
docs/
specs/          feature specs, contracts (e.g. 001-monorepo-restructure)
```

Human onboarding: `specs/001-monorepo-restructure/quickstart.md` (install, build, dev filters, layout).

## Commands

- `pnpm install` - install all workspaces (hoisted `node-linker` for NativeScript)
- `pnpm build` - monorepo build via Turbo (`^build` graph; excludes `@dayparty/web-legacy`)
- `pnpm build:legacy` - Next.js build for `@dayparty/web-legacy` only
- `pnpm test` - tests via Turbo (depends on `build`)
- `pnpm lint` - lint across configured workspaces
- `pnpm dev` - Turbo persistent dev tasks (API, web, etc. where defined)
- `pnpm --filter @dayparty/api dev` - API only (e.g. http://localhost:3001); uses `node --import extensionless/register` so extensionless relative imports in emitted ESM resolve (see `@dayparty/api` scripts)
- `pnpm --filter @dayparty/web dev` - web only (e.g. http://localhost:5173)
- `pnpm --filter @dayparty/mobile run ios|android` - NativeScript targets
- `pnpm --filter @dayparty/<package> test` - single-package tests

## Code Style

- Use TypeScript across packages/apps
- Follow existing naming/import/module conventions in each package
- Prefer package-scoped validation commands when a legacy app task is interactive

## Commit Conventions

- Use gitmoji commit subjects in the format `<emoji> (<scope>): <description lowercase>`
- Pick a narrow scope that matches the package or app being changed
- For non-trivial changes, include a commit body after a blank line with concise details:
  - what changed
  - why it changed
  - relevant validation commands
- Omit the body for very small changes

## Monorepo Notes

- **Tidy ↔ monorepo mapping** (feature 002): canonical table and structure notes live in [`specs/002-tidy-arch-alignment/plan.md`](specs/002-tidy-arch-alignment/plan.md) — use it when placing core vs adapter vs infrastructure code.
- Prefer `pnpm` commands at repo root over `npm`
- Shared libraries currently live under `packages/`, including `core`, `validation`, `domain`, `db`, `api-client`, `typescript-config`, and `eslint-config`
- The existing reference app in this workspace is `apps/web-legacy`

## Agent Precedence

- If multiple instruction files exist, this file is authoritative
- Other instruction files should symlink here

<!-- MANUAL ADDITIONS START -->

## Manual Additions

- Commit messages MUST use gitmoji format: `<emoji> (<scope>): <description lowercase>`
- Use a narrow scope tied to the changed area (for example: `api-client`, `agents`, `domain`)
- For non-trivial commits, include a body with what changed, why, and validation commands
<!-- MANUAL ADDITIONS END -->

## Recent Changes

- 003-vision-aligned-rebuild: Added TypeScript 5.x (strict mode incremental) + Turborepo, pnpm 10, Hono (`apps/api`), React 19 + Vite (`apps/web`), NativeScript 9 (`apps/mobile`), Zod (`@dayparty/validation`), MongoDB driver (`@dayparty/db`), `DayPartyClient` (`@dayparty/api-client`)

- 002-tidy-arch-alignment: Documented stack paths and Mongo access via domain ports + `@dayparty/db` in agent context (plan-driven update).
- 001-monorepo-restructure: Added TypeScript 5.x (strict mode goal, incremental migration) + Turborepo, pnpm 10, Hono, NativeScript 9 + Vite, React 19, Zod, mongodb driver
