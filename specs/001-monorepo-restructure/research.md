# Research: Monorepo Restructure + API + Mobile Scaffold

**Phase 0 output** — Tech decisions, constraints, and resolution of unknowns.

## Decision Log

### D1: Monorepo Tooling — Turborepo + pnpm workspaces

**Options considered**: Turborepo, Nx, Lerna, plain pnpm workspaces
**Decision**: Turborepo + pnpm workspaces
**Rationale**: Simplest option that provides caching and parallel builds. Nx is more powerful
but adds complexity the team doesn't need. Lerna is effectively deprecated. Plain pnpm
workspaces lacks orchestration (build ordering, caching).
**Risk**: NativeScript needs `shamefully-hoist=true` in `.npmrc` — tested and confirmed
to work with pnpm workspace hoisting.

### D2: API Framework — Hono

**Options considered**: Hono, Express, Fastify, tRPC
**Decision**: Hono
**Rationale**: TypeScript-first, lightweight (<14KB), Web Standards API (fetch, Request,
Response). Runs on Node, Bun, Deno, and edge runtimes. Middleware pattern is simple.
tRPC was rejected because mobile (NativeScript) doesn't benefit from the type-safe client
the same way a React app does — a typed fetch-based api-client is sufficient and simpler.
**Risk**: Hono is newer than Express/Fastify but is stable (v4+, backed by Cloudflare).

### D3: NativeScript Flavor — TypeScript puro (no framework)

**Options considered**: NativeScript + Angular, NativeScript + Vue, NativeScript + Solid,
NativeScript + TypeScript puro
**Decision**: TypeScript puro
**Rationale**: Minimum abstraction, direct native API access, no framework overhead.
The app has 3 screens — a UI framework adds complexity without proportional benefit.
XML layouts + TypeScript code-behind is NativeScript's most lightweight pattern.
**Risk**: No reactive data binding out of the box. Manual UI updates via Observable pattern
(NativeScript's built-in Observable class). Acceptable for 3 simple screens.

### D4: Package Build Tool — tsc

**Options considered**: tsc, tsup, unbuild, rollup
**Decision**: tsc (TypeScript compiler directly)
**Rationale**: Constitution principle I (Simplicity-First). Packages are pure TypeScript
libraries consumed by apps that have their own bundlers. No need for bundling, tree-shaking,
or multiple output formats at the package level. `tsc` outputs `.js` + `.d.ts`, done.
**Risk**: Slower than tsup for large packages. Not a concern at current scale.

### D5: Web Client Tooling — Vite + React

**Options considered**: Next.js (existing), Vite + React, plain React
**Decision**: Vite + React for the minimal web client
**Rationale**: The minimal web client (`apps/web/`) exists only to validate that
`api-client` works from a browser context. Vite is the simplest way to get a React
app running without SSR complexity. The final web architecture is intentionally deferred.
**Risk**: None — this is explicitly a throwaway testing client.

### D6: MongoDB Driver — Direct mongodb package (no ODM)

**Options considered**: Mongoose, mongodb driver, Prisma
**Decision**: Direct `mongodb` driver
**Rationale**: The existing codebase already uses the raw mongodb driver via
`getCollection()`. Mongoose adds an abstraction layer with schemas that would conflict
with our TypeScript types. Prisma doesn't support MongoDB well. Keeping the raw driver
maintains consistency and simplicity.
**Risk**: No built-in schema validation at DB level. Mitigated by Zod validation at
API boundaries.

### D7: JWT Library — jsonwebtoken

**Options considered**: jsonwebtoken, jose
**Decision**: jsonwebtoken (existing)
**Rationale**: Already used in the current codebase (`JsonWebTokenAuthTokenService`).
No reason to switch. `jose` is more modern but the migration effort isn't justified.
**Risk**: `jsonwebtoken` is not edge-compatible (uses Node crypto). Not a concern since
the API runs on Node/Bun, not edge workers.

## Constraints Verified

| Constraint                         | Status        | Notes                                                                                      |
| ---------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| NativeScript 9 + pnpm workspaces   | ✅ Compatible | Requires `shamefully-hoist=true` and explicit package mappings in `nativescript.config.ts` |
| Hono + MongoDB                     | ✅ Compatible | Hono is runtime-agnostic; MongoDB driver works on Node/Bun                                 |
| TypeScript strict mode in packages | ✅ Feasible   | New packages start strict. Legacy app incremental.                                         |
| Zod in NativeScript                | ✅ Compatible | Zod is pure TypeScript, no Node/browser-specific APIs                                      |
| Native fetch in NativeScript       | ✅ Available  | NativeScript polyfills fetch via `@nativescript/core/http`                                 |

## Open Questions (Resolved)

| Question                                         | Resolution                                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Where do service implementations live?           | `apps/api/src/services/` for API-specific (JWT signing, email sending). These implement interfaces from `@dayparty/domain`. |
| How does mobile store JWT?                       | `@nativescript/secure-storage` for token, `ApplicationSettings` for cached data                                             |
| How does auth work on mobile without deep links? | MVP: user manually enters verification code / session ID. Or web redirect flow opens in-app browser. Deep links deferred.   |
| Should packages use ESM or CJS?                  | ESM (`"type": "module"` in package.json). All consumers support ESM.                                                        |
| Should web-legacy depend on extracted packages?  | No — `apps/web-legacy/` keeps its original code as-is for reference. It may break and that's accepted.                      |
