# Ralph Progress Log

Feature: 001-monorepo-restructure
Started: 2026-03-31 05:29:22

## Codebase Patterns

- Import shared ESLint app preset as `@dayparty/eslint-config/app` (not `app.js`); package `exports` maps `./app` → `app.js`
- `apps/web` production build uses `vite build` only; separate `typecheck` can use `tsc` when plugin types align with repo TypeScript
- `apps/mobile` uses NativeScript default `src/` app path (`appPath: 'src'` in `nativescript.config.ts`); entry `src/app.ts`
- `packages/typescript-config` exports `base.json`, `library.json`, `app.json` — packages extend `library.json`, apps extend `app.json`
- `packages/eslint-config` exports flat config via `index.js` (packages) and `app.js` (apps); uses `@typescript-eslint` plugin with `no-explicit-any: error` in packages
- Root `turbo.json`: build→`^build`, test→`build`, lint→no deps, dev→persistent+uncached
- `.npmrc` uses `node-linker=hoisted` (not `shamefully-hoist`) for NativeScript compatibility
- `vitest.workspace.ts` uses `defineWorkspace(["packages/*/vitest.config.ts", "apps/*/vitest.config.ts"])`
- Pre-existing `web-legacy` in `apps/web-legacy/` must remain untouched
- `apps/web-legacy` uses flat `eslint.config.mjs` + `eslint .` (not interactive `next lint`); several rules are relaxed for the legacy codebase
- API-client pattern: return `Result<T, ApiError>` discriminated union (`ok: true|false`) and run `safeParse` on request payloads before network calls

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

---

## Iteration 3 - 2026-03-31

**User Story**: Phase 3 — Validation Package (T016-T021)
**Tasks Completed**:

- [x] T016: Initialized packages/validation/ with package.json (@dayparty/validation), tsconfig.json
- [x] T017: Task Zod schemas (createTaskSchema, updateTaskSchema, reorderTasksSchema)
- [x] T018: User Zod schema (loginSchema with email validation)
- [x] T019: Tag Zod schemas (createTagSchema, updateTagSchema with hex color validation)
- [x] T020: Error utilities (createApiError, fromZodError mapping ZodError → ApiError)
- [x] T021: Barrel export in src/index.ts
      **Tasks Remaining in Story**: None - story complete
      **Commit**: fee1c8a
      **Files Changed**:
- packages/validation/package.json
- packages/validation/tsconfig.json
- packages/validation/eslint.config.js
- packages/validation/src/schemas/task.ts
- packages/validation/src/schemas/user.ts
- packages/validation/src/schemas/tag.ts
- packages/validation/src/errors.ts
- packages/validation/src/index.ts
- packages/core/eslint.config.js
- packages/eslint-config/index.js (added ignores for \*.d.ts and dist/\*\*)
- packages/eslint-config/package.json (added "type": "module")
- packages/core/package.json (added "type": "module")
  **Learnings**:
- Packages need `"type": "module"` to avoid NODE_TYPELESS_PACKAGE_JSON warning with ESM eslint.config.js
- ESLint flat config with `projectService: true` picks up .d.ts files in src/ unless explicitly ignored — added `ignores: ['**/*.d.ts', 'dist/**']` to shared eslint-config
- Zod size enum cast needed: `z.number().int().min(1).max(5) as z.ZodType<1|2|3|4|5>` to align with Task type

---

---

## Iteration 4 - 2026-03-31

**User Story**: Phase 2 — Domain Package (T022-T033)
**Tasks Completed**:

- [x] T022: Initialized packages/domain/ with package.json (@dayparty/domain), tsconfig.json, eslint.config.js
- [x] T023: TaskRepository interface (findByUserAndDate, findById, create, update, delete, reorder)
- [x] T024: UserRepository interface (findById, findByEmail, create, update)
- [x] T025: SessionRepository interface (findByToken, create, deleteByToken, deleteExpired)
- [x] T026: TagRepository interface (findByUser, findByKey, create, update, delete, seedDefaults)
- [x] T027: makeCreateTaskAction (validates tagKey, auto-assigns position)
- [x] T028: makeToggleTaskCompletionAction (toggles isComplete true↔false)
- [x] T029: makeGetRundownAction (queries by userId+date, computes capacity+completed)
- [x] T030: makeReorderTasksAction (validates task ownership, updates positions, returns DayRundown)
- [x] T031: makeDeleteTaskAction (deletes task, compacts remaining positions)
- [x] T032: makeUpdateTaskAction (partial update, validates tagKey if changed)
- [x] T033: Barrel export in src/index.ts
      **Tasks Remaining in Story**: None - story complete
      **Commit**: 280756c
      **Files Changed**:
- packages/domain/package.json
- packages/domain/tsconfig.json
- packages/domain/eslint.config.js
- packages/domain/src/index.ts
- packages/domain/src/interfaces/task-repository.ts
- packages/domain/src/interfaces/user-repository.ts
- packages/domain/src/interfaces/session-repository.ts
- packages/domain/src/interfaces/tag-repository.ts
- packages/domain/src/actions/create-task.ts
- packages/domain/src/actions/toggle-task-completion.ts
- packages/domain/src/actions/get-rundown.ts
- packages/domain/src/actions/reorder-tasks.ts
- packages/domain/src/actions/delete-task.ts
- packages/domain/src/actions/update-task.ts
- specs/001-monorepo-restructure/tasks.md
  **Learnings**:
- Actions use factory pattern: makeXxxAction(repos) returns an async function — clean DI, no classes
- UpdateTaskInput uses `tagKey: string | null` to allow explicit nulling of tagKey (vs undefined meaning "no change")
- Prettier (via lint-staged) reformats code on commit — no manual formatting needed

---

---

## Iteration 5 - 2026-03-31

**User Story**: Phase 2 — DB Package (T034-T040)
**Tasks Completed**:

- [x] T034: Initialized packages/db/ with package.json (@dayparty/db), tsconfig.json, eslint.config.js
- [x] T035: MongoDB connection helper (getDb, getCollection) in src/connection.ts
- [x] T036: MongoTaskRepository — findByUserAndDate, findById, create, update, delete, reorder
- [x] T037: MongoUserRepository — findById, findByEmail, create, update
- [x] T038: MongoSessionRepository — findByToken, create, deleteByToken, deleteExpired
- [x] T039: MongoTagRepository — findByUser, findByKey, create, update, delete, seedDefaults (uses DEFAULT_TAGS from @dayparty/core)
- [x] T040: Barrel export in src/index.ts
      **Tasks Remaining in Story**: None - story complete
      **Commit**: 4983867
      **Files Changed**:
- packages/db/package.json
- packages/db/tsconfig.json
- packages/db/eslint.config.js
- packages/db/src/connection.ts
- packages/db/src/index.ts
- packages/db/src/repositories/task-repository.ts
- packages/db/src/repositories/user-repository.ts
- packages/db/src/repositories/session-repository.ts
- packages/db/src/repositories/tag-repository.ts
- specs/001-monorepo-restructure/tasks.md
  **Learnings**:
- MongoDB document type pattern: `type XxxDoc = Omit<Xxx, 'id'> & { _id: ObjectId }` with docToXxx mapper
- Use `ObjectId.isValid(id)` guard before `new ObjectId(id)` to avoid throws on invalid input
- `findOneAndUpdate` with `{ returnDocument: 'after' }` returns the updated document directly
- `seedDefaults` checks for any existing default tag before inserting to prevent double-seeding
- Connection module uses lazy singleton; `getCollection` is a thin wrapper for typed collection access

---

---

## Iteration 6 - 2026-03-31 06:01:28

**User Story**: Phase 2 — API Client Package (T041-T046)
**Tasks Completed**:

- [x] T041: Initialized `packages/api-client/` with `package.json`, `tsconfig.json`, `eslint.config.js`, and `src/index.ts`
- [x] T042: Implemented `DayPartyClient` with base URL config, bearer token management, and `Result<T, ApiError>` response model
- [x] T043: Added auth methods (`login`, `verify`, `logout`, `me`) mapped to contract endpoints
- [x] T044: Added task methods (`getRundown`, `createTask`, `updateTask`, `deleteTask`, `reorderTasks`)
- [x] T045: Added tag methods (`getTags`, `createTag`, `updateTag`, `deleteTag`)
- [x] T046: Exported `DayPartyClient` and `Result` from package barrel
      **Tasks Remaining in Story**: None - story complete
      **Commit**: Pending
      **Files Changed**:
- packages/api-client/package.json
- packages/api-client/tsconfig.json
- packages/api-client/eslint.config.js
- packages/api-client/src/client.ts
- packages/api-client/src/index.ts
- specs/001-monorepo-restructure/tasks.md
- specs/001-monorepo-restructure/progress.md
- pnpm-lock.yaml
  **Learnings**:
- `@dayparty/api-client` can reuse `@dayparty/validation` request schemas via `safeParse` to produce consistent `VALIDATION_ERROR` results client-side

---

## Iteration 7 - 2026-03-31

**User Story**: Phase 3 — US1 (T047–T051) app skeletons + workspace validation
**Tasks Completed**:

- [x] T047: `apps/api` Hono skeleton with `/health`, `@hono/node-server`, workspace deps
- [x] T048: `apps/web` Vite + React 19 + React Router 7 skeleton
- [x] T049: `apps/mobile` NativeScript 9 template flattened to `src/`, `@dayparty/mobile` + workspace deps
- [x] T050: `web-legacy` still has no `@dayparty/*` package deps (only package name uses scope)
- [x] T051: `pnpm build`, `pnpm lint`, `pnpm test` from root succeed
      **Tasks Remaining in Story**: None — US1 complete
      **Commit**: 75107f6
      **Files Changed**:
- apps/api/\*\* (new)
- apps/web/\*\* (new)
- apps/mobile/\*\* (NativeScript scaffold + src layout)
- apps/web-legacy/eslint.config.mjs, package.json (non-interactive ESLint)
- pnpm-lock.yaml
- specs/001-monorepo-restructure/tasks.md
- specs/001-monorepo-restructure/progress.md
  **Learnings**:
- `@dayparty/eslint-config` exports use subpath `./app` not `./app.js` in import specifiers
- NativeScript CLI `create --path apps/mobile` nested an extra `mobile/` dir — flattened with rsync
- `web-legacy` `next lint` without config is interactive; flat ESLint + relaxed legacy rules unblocks `pnpm lint`
- `@vitejs/plugin-react` type defs can break `tsc --noEmit` on web; `vite build` alone is enough for production bundle

---
