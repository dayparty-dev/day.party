# day.party Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-31

## Active Technologies

- TypeScript 5.x (strict mode goal, incremental migration) + Turborepo, pnpm 10, Hono, NativeScript 9 + Vite, React 19, Zod, mongodb driver (001-monorepo-restructure)

## Project Structure

```text
apps/
packages/
docs/
specs/
```

## Commands

- `pnpm build` - run the monorepo build via Turbo
- `pnpm test` - run the monorepo test pipeline via Turbo
- `pnpm lint` - run lint checks across configured workspaces
- `pnpm dev` - start workspace dev commands

## Code Style

TypeScript 5.x (strict mode goal, incremental migration): Follow standard conventions

## Commit Conventions

- Use gitmoji commit subjects in the format `<emoji> (<scope>): <description lowercase>`
- Pick a narrow scope that matches the package or app being changed
- For non-trivial changes, include a commit body after a blank line with concise details on what changed, why, and any relevant validation
- Omit the body for very small changes

## Monorepo Notes

- Prefer `pnpm` commands at the repo root over `npm`
- Shared libraries currently live under `packages/`, including `core`, `validation`, `domain`, `db`, `typescript-config`, and `eslint-config`
- The main existing app in this workspace is `apps/web-legacy`

## Recent Changes

- 001-monorepo-restructure: Added TypeScript 5.x (strict mode goal, incremental migration) + Turborepo, pnpm 10, Hono, NativeScript 9 + Vite, React 19, Zod, mongodb driver

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
