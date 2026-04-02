# Ralph Progress Log

Feature: 003-vision-aligned-rebuild
Started: 2026-04-02 15:10:01

## Codebase Patterns

- **User preferences Mongo**: Collection `user_preferences`; documents are `UserPreferences` fields plus internal `_id`; query and upsert by `userId`. `put` uses `updateOne` when a row exists, else `insertOne` (avoids `replaceOne` typing issues with `WithoutId`).
- **Core models**: Prefer `Partial<Record<TaskSize, number>>` for optional size→minutes maps aligned with `TaskSize` in `SIZE_SCALE`.
- **`computeDayFit`**: Greedy pack in task order; `plannedMinutes` sums effective minutes for **incomplete** tasks only; completed tasks are always `inRunwayTaskIds` and use no runway minutes; `overflowUnresolved` when any incomplete **essential** task is outside the runway. Default size→minutes: 15/25/40/55/75 for sizes 1–5; overridden by prefs `sizeToMinutes`.
- **`DEFAULT_SIZE_TO_MINUTES`**: Single export from `@dayparty/core` for domain fit + Mongo read-path legacy fill; keep aligned.
- **Prefs Zod**: `patchUserPreferencesSchema` / `dayWindowSchema` enforce midnight-crossing vs same-day window rules; `sizeToMinutes` patch uses strict keys `1`–`5` only.

---

## Iteration 1 - 2026-04-02

**User Story**: Phase 2 — Foundational (user preferences port; prerequisite to US1)

**Tasks Completed**:

- [x] T002: `DayWindow`, `UserPreferences`, `VisualPreset` in `@dayparty/core`
- [x] T003: `UserPreferencesRepository` port in `@dayparty/domain`
- [x] T004: `MongoUserPreferencesRepository` in `@dayparty/db`
- [x] T005: `userPrefsRepo` on `ApiEnv` and construction in `apps/api/src/index.ts`

**Tasks Remaining in Story**: None — story complete

**Commit**: cf0f8d983f2f76e1c891d2cfc0f18a58c0824a30

**Files Changed**:

- `packages/core/src/models/user-preferences.ts`
- `packages/core/src/index.ts`
- `packages/domain/src/interfaces/user-preferences-repository.ts`
- `packages/domain/src/index.ts`
- `packages/db/src/repositories/user-preferences-repository.ts`
- `packages/db/src/index.ts`
- `apps/api/src/types.ts`
- `apps/api/src/index.ts`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- MongoDB Node driver types reject `_id` in `replaceOne` replacement documents typed as `WithoutId`; branch insert vs `updateOne` `$set` for `put` semantics.
- **US1 rundown shape**: `DayRundown` requires `dayFit` and `dayWindow`. Until T007–T008, domain actions return `EMPTY_DAY_FIT` and `DEFAULT_DAY_WINDOW` from `@dayparty/core`.

---

## Iteration 2 - 2026-04-02

**User Story**: Partial progress on US1 — core models for day fit + window echo (T006)

**Tasks Completed**:

- [x] T006: `TaskEssentiality`, optional `estimatedMinutes` / `essentiality` on `Task`; `DayFit`, `DayRundown.dayFit` + `dayWindow`; `DEFAULT_DAY_WINDOW`, `EMPTY_DAY_FIT`; rundown actions + api-client parse alignment

**Tasks Remaining in Story**: 9 (T007–T015)

**Commit**: e4fa70356cc4f5808e83bad569b0ddd0bb857078

**Files Changed**:

- `packages/core/src/models/task.ts`
- `packages/core/src/models/day-rundown.ts`
- `packages/core/src/models/user-preferences.ts`
- `packages/core/src/index.ts`
- `packages/domain/src/actions/get-rundown.ts`
- `packages/domain/src/actions/reorder-tasks.ts`
- `packages/domain/src/actions/get-rundown.test.ts`
- `packages/api-client/src/client.ts`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- Contract uses `priority` / `essentiality`; data model lists `essential` \| `normal` \| `optional` — implemented as `TaskEssentiality` + field `essentiality` on `Task`.

---

## Iteration 3 - 2026-04-02

**User Story**: Partial progress on US1 — domain day fit + prefs-backed rundown (T007–T008)

**Tasks Completed**:

- [x] T007: `computeDayFit` + `windowAvailableMinutes` in `packages/domain/src/day-fit.ts`; Vitest coverage in `day-fit.test.ts`
- [x] T008: `makeGetRundownAction` / `makeReorderTasksAction` take `UserPreferencesRepository`, echo `dayWindow` and real `dayFit` (API wiring in `apps/api/src/index.ts`)

**Tasks Remaining in Story**: 7 (T009–T015)

**Commit**: 146ed134f47a317b082a095d050985987bb2d62b

**Files Changed**:

- `packages/domain/src/day-fit.ts`
- `packages/domain/src/day-fit.test.ts`
- `packages/domain/src/index.ts`
- `packages/domain/src/actions/get-rundown.ts`
- `packages/domain/src/actions/get-rundown.test.ts`
- `packages/domain/src/actions/reorder-tasks.ts`
- `apps/api/src/index.ts`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- `makeReorderTasksAction` also needs prefs + `computeDayFit` so reorder responses match rundown (not spelled out in T008 but required for consistent API).

---

## Iteration 4 - 2026-04-02

**User Story**: Partial progress on US1 — validation + persistence for estimates and essentiality (T009–T010)

**Tasks Completed**:

- [x] T009: Extended task Zod schemas; added `user-preferences.ts` (`patchUserPreferencesSchema`, `dayWindowSchema`, `visualPresetSchema`, `sizeToMinutesPartialSchema`); wired `create`/`update` domain actions for new task fields so API spreads match types.
- [x] T010: `MongoTaskRepository.docToTask` fills `estimatedMinutes` from `DEFAULT_SIZE_TO_MINUTES` when BSON omits it; `DEFAULT_SIZE_TO_MINUTES` moved to `@dayparty/core`.

**Tasks Remaining in Story**: 5 (T011–T015)

**Commit**: e3783eef202b96ee419c58f880afaa31f1746790

**Files Changed**:

- `packages/core/src/constants/index.ts`
- `packages/core/src/index.ts`
- `packages/domain/src/day-fit.ts`
- `packages/domain/src/actions/create-task.ts`
- `packages/domain/src/actions/update-task.ts`
- `packages/validation/src/schemas/task.ts`
- `packages/validation/src/schemas/user-preferences.ts`
- `packages/validation/src/index.ts`
- `packages/db/src/repositories/task-repository.ts`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- T011 is still needed for explicit route/docs copy even though create/update already use extended Zod inference against existing handlers.

---
