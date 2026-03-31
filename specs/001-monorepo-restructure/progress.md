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

---

## Iteration 2 - 2026-03-31

**User Story**: Phase 2 — Core Package (T007-T015)
**Tasks Completed**:

- [x] T007: Initialized packages/core/ with package.json (@dayparty/core) and tsconfig.json
- [x] T008: Task type (id, userId, title, size 1|2|3|4|5, tagKey?, isComplete, scheduledDate, position, createdAt, updatedAt)
- [x] T009: User type (id, email, displayName?, role, createdAt, updatedAt)
- [x] T010: Session type (id, userId, token, expiresAt, createdAt)
- [x] T011: Tag type (id, userId, key, displayName, color?, icon?, isDefault, createdAt)
- [x] T012: DayRundown type (date, userId, tasks, capacity, completed)
- [x] T013: ApiError type (code, message, fields?)
- [x] T014: Constants — SIZE_SCALE, DEFAULT_TAGS, ERROR_CODES with ErrorCode type
- [x] T015: Barrel export in src/index.ts
      **Tasks Remaining in Story**: None - Core Package complete
      **Commit**: bba745b
      **Files Changed**:
- packages/core/package.json
- packages/core/tsconfig.json
- packages/core/src/index.ts
- packages/core/src/models/task.ts
- packages/core/src/models/user.ts
- packages/core/src/models/session.ts
- packages/core/src/models/tag.ts
- packages/core/src/models/day-rundown.ts
- packages/core/src/models/api-error.ts
- packages/core/src/constants/index.ts
- specs/001-monorepo-restructure/tasks.md
  **Learnings**:
- tsconfig extends with relative rootDir/outDir must be overridden in each local tsconfig.json — the inherited path resolves relative to the parent config file, not the extending one
- dist/ files committed (no .gitignore exclusion for packages/core/dist); consider adding gitignore if desired
- sed 's/T01.../T01.../' was too broad — use python3 for precise task checkbox replacements

---
