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
