# Ralph Progress Log

Feature: 001-monorepo-restructure
Started: 2026-03-31 05:29:22

## Codebase Patterns

- `packages/typescript-config` exports `base.json`, `library.json`, `app.json` — packages extend `library.json`, apps extend `app.json`
- `packages/eslint-config` exports flat config via `index.js` (packages) and `app.js` (apps); uses `@typescript-eslint` plugin with `no-explicit-any: error` in packages
- Root `turbo.json`: build→`^build`, test→`build`, lint→no deps, dev→persistent+uncached
- `.npmrc` uses `node-linker=hoisted` (not `shamefully-hoist`) for NativeScript compatibility
- `vitest.workspace.ts` uses `defineWorkspace(["packages/*/vitest.config.ts", "apps/*/vitest.config.ts"])`
- Pre-existing `web-legacy` in `apps/web-legacy/` must remain untouched

---

## Iteration 1 - 2026-03-31

**User Story**: Phase 1 — Setup (Shared Infrastructure)
**Tasks Completed**:

- [x] T001: pnpm-workspace.yaml already correctly configured
- [x] T002: Updated .npmrc — replaced `shamefully-hoist=true` with `node-linker=hoisted`
- [x] T003: Added `test` (dependsOn: build) and `lint` (no deps) tasks to turbo.json
- [x] T004: Created packages/typescript-config with base.json, library.json, app.json
- [x] T004a: Created packages/eslint-config with index.js (base) and app.js (app overrides)
- [x] T005: Created vitest.workspace.ts at repo root
- [x] T006: Added `test` and `lint` scripts to root package.json
      **Tasks Remaining in Story**: None - phase complete
      **Commit**: 4dfb2e5
      **Files Changed**:
- .npmrc
- turbo.json
- package.json
- vitest.workspace.ts
- packages/typescript-config/package.json
- packages/typescript-config/base.json
- packages/typescript-config/library.json
- packages/typescript-config/app.json
- packages/eslint-config/package.json
- packages/eslint-config/index.js
- packages/eslint-config/app.js
- specs/001-monorepo-restructure/tasks.md
  **Learnings**:
- .npmrc already existed with `shamefully-hoist=true`; replaced with `node-linker=hoisted` per research.md
- pnpm-workspace.yaml and turbo.json already existed but were incomplete (missing test/lint)
- pnpm install succeeded cleanly (pre-existing peer dep warning in web-legacy is unrelated)
- eslint-config uses JS (not TS) for flat config files since the package has no build step

---
