# day.party Development Guidelines

Canonical instructions for AI coding agents in this repository.
Last updated: 2026-03-31

## Active Technologies

- TypeScript 5.x (strict mode goal, incremental migration)
- Turborepo
- pnpm 10
- Hono
- NativeScript 9 + Vite
- React 19
- Zod
- mongodb driver

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

- Prefer `pnpm` commands at repo root over `npm`
- Shared libraries currently live under `packages/`, including `core`, `validation`, `domain`, `db`, `api-client`, `typescript-config`, and `eslint-config`
- The existing reference app in this workspace is `apps/web-legacy`

## Agent Precedence

- If multiple instruction files exist, this file is authoritative
- Other instruction files should symlink here
