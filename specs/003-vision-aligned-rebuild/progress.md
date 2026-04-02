# Ralph Progress Log

Feature: 003-vision-aligned-rebuild
Started: 2026-04-02 15:10:01

## Codebase Patterns

- **User preferences Mongo**: Collection `user_preferences`; documents are `UserPreferences` fields plus internal `_id`; query and upsert by `userId`. `put` uses `updateOne` when a row exists, else `insertOne` (avoids `replaceOne` typing issues with `WithoutId`).
- **Core models**: Prefer `Partial<Record<TaskSize, number>>` for optional size→minutes maps aligned with `TaskSize` in `SIZE_SCALE`.

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

---
