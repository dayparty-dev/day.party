# Research: Monorepo Restructure

**Feature**: 001-monorepo-restructure
**Date**: 2026-03-31
**Resolves**: All NEEDS CLARIFICATION items from Technical Context

---

### 1. Test Runner

**Decision**: Vitest with `vitest.workspace.ts` at the monorepo root.
**Rationale**: Native ESM and TypeScript support out of the box — no `ts-jest` or babel config. Reuses Vite's transform pipeline, which the React web app and NativeScript Vite app already use. `vitest.workspace.ts` with `defineWorkspace(["packages/*/vitest.config.ts", "apps/*/vitest.config.ts"])` enables single-command workspace-wide execution. Faster cold starts than Jest. Jest-compatible assertion/mock API eases migration. Turborepo can cache `turbo run test` per-package via `dependsOn: ["^build"]`.
**Alternatives Considered**: Jest — mature but requires `ts-jest` or `@swc/jest` preprocessor config, poor native ESM support, heavier config burden in a pure-ESM monorepo. `bun test` — fast but lacks the workspace/project model, weaker ecosystem for coverage and reporters.

---

### 2. Hono Runtime

**Decision**: Node.js (via `@hono/node-server`) for the Hono API server.
**Rationale**: The official MongoDB Node.js driver has known compatibility issues under Bun (memory leaks, `async_hooks` edge cases). Node.js 22+ is LTS, battle-tested in production, and has zero MongoDB driver friction. Hono's Node.js adapter is a first-class runtime target. Deployment to any container/serverless platform is straightforward.
**Alternatives Considered**: Bun — faster startup and built-in TS transpilation, but MongoDB driver compatibility issues make it risky for a MongoDB-backed API in production. Worth revisiting once those issues are resolved.

---

### 3. NativeScript 9 + Vite Monorepo Integration

**Decision**: Use pnpm workspace protocol (`workspace:*`) dependencies with `node-linker=hoisted` in `.npmrc`, and pre-build shared packages to `dist/`.
**Rationale**: NativeScript 9 uses Vite as its build tool. NativeScript's Vite plugin resolves modules from the app's `node_modules`, and pnpm's default isolated `node_modules` structure (symlinked `.pnpm` store) can confuse NativeScript's module resolution. Setting `node-linker=hoisted` ensures native modules and NativeScript plugins resolve correctly. Shared packages expose compiled `dist/` via `exports` in `package.json` — NativeScript's Vite build treats them as regular node_modules, avoiding TS path alias issues.
**Alternatives Considered**: TypeScript path aliases (`paths` in `tsconfig`) — breaks at NativeScript build time since its Vite plugin doesn't honor workspace tsconfig paths. Local registry publishing — unnecessary complexity when workspace protocol + hoisting works.

---

### 4. Turborepo + pnpm Workspace Configuration

**Decision**: Shared `@dayparty/typescript-config` package with base/library/app presets; `turbo.json` task graph with `^build` dependency topology; `dev` as persistent + uncached.
**Rationale**: A `packages/typescript-config/` package exports `base.json` (strict, `moduleResolution: "bundler"`, `module: "ESNext"`, `target: "ES2022"`), `library.json` (extends base, adds `outDir/rootDir`), and `app.json` variants. Each package `tsconfig.json` extends the shared config. The `turbo.json` task graph:

- `build` → `dependsOn: ["^build"]`, `outputs: ["dist/**"]` — packages build before dependent apps
- `test` → `dependsOn: ["build"]` — tests run against compiled output
- `dev` → `cache: false`, `persistent: true` — watch mode for all apps/packages in parallel
- `lint` → no dependencies, parallelizable
  **Alternatives Considered**: TypeScript project references (`composite: true`) — doesn't play well with Vite/esbuild which ignore them. Nx — more powerful but heavier than needed for this topology.

---

### 5. Minimal React Web Client Stack

**Decision**: Vite + React 19 SPA with React Router v7 for routing, CSS Modules for styling.
**Rationale**: Vite is already the bundler across the monorepo (NativeScript, Vitest). React Router v7 is the most mature client-side router with broad ecosystem support. CSS Modules work out of the box with Vite, require no extra dependencies, and fit a minimal prototype. The shared `@dayparty/api-client` package handles all server communication — the web app stays thin.
**Alternatives Considered**: TanStack Router — superior type-safe features but overkill for a minimal prototype. Tailwind CSS — viable but adds build dependency; CSS Modules are zero-config.

---

### 6. Typed API Client Package Design

**Decision**: Custom fetch-based client with Zod schema validation on responses, mapping to a shared `ApiError` type.
**Rationale**: `fetch` is available in all target runtimes (browser, Node.js 18+, NativeScript) with zero polyfills. Zod schemas from `@dayparty/validation` serve as single source of truth — `z.infer<typeof Schema>` generates types, `.safeParse()` validates responses at runtime. The client exposes typed methods per endpoint that return `Result<T, ApiError>` (discriminated union), keeping error handling explicit. No axios needed — fetch + Zod covers type-safe request/response with less bundle weight and full portability.
**Alternatives Considered**: Axios — adds ~13KB, has its own error model conflicting with the shared `ApiError` type, NativeScript compat requires extra config. `ky` — nice sugar over fetch but another dependency where raw fetch with a thin wrapper suffices.
