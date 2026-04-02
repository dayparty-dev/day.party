# Ralph Progress Log

Feature: 003-vision-aligned-rebuild
Started: 2026-04-02 15:10:01

## Codebase Patterns

- **Create task bounty (T053)**: Web `CreateTaskPanel` optional bounty block: amount (points), comma-separated scope tags, **High resistance** checkbox; omitted from POST when amount empty; same bounds as `taskBountySchema` / `TaskEditPanel`.
- **Focus `planned` ↔ `in_progress` (T052 / T055)**: Web `TaskCard` exposes optional `onToggleFocus` + `focusBusy`; `RundownPage` calls `updateTask` with flipped `status`; `OngoingPage` prefers the first incomplete task with `status === 'in_progress'`, then offers **Start** / **Pause** (`updateTask`). Mobile rundown rows use **Enfoque** / **Pausa** (`toggleFocusFor`); `ongoing-view` mirrors pick + toggle. **In progress** badge on web `TaskCard` (`focusTag`).
- **Mobile task detail (T054)**: `apps/mobile/src/views/task-detail-view.{ts,xml}` — `authState.navigateToTaskDetail(taskId)` passes `Frame` `context`; `onNavigatingTo` reads `args.context` / `page.navigationContext`. Full edit + `notesMarkdown` + bounty (Spanish copy); `ListPicker` for status / essentiality / tag; `Observable.propertyChangeEvent` on `statusIndex` toggles deferred date visibility.
- **Rewards / ledger (US4 T024–T030)**: `RewardDefinition` / `RewardDefinitionType` in `@dayparty/core` (`models/reward.ts`); `LedgerEntry` / `LedgerEntryReason` in `models/ledger.ts`. `Task.bounty?: TaskBounty` (`amount`, optional `tagKeys`, `highResistance`). Domain ports: `RewardDefinitionRepository` (`listByUserId`, `findById`, `create`), `LedgerRepository` (`insert` append-only omitting `id`/`createdAt`, `listByUserId` with `limit` + optional cursor, `findByCorrelation`, `sumAmountByUserId`). Mongo: `reward_definitions`, `ledger_entries`. Re-export document types from interface modules via `@dayparty/core` (avoid duplicate domain copies).
- **US4 API**: `GET`/`POST /api/rewards`, `GET /api/ledger?limit=&cursor=`, `POST /api/marketplace/purchase` with `{ rewardDefinitionId }`. Responses omit `userId` on rewards and ledger rows. **Bounty**: `makeUpdateTaskAction` takes `LedgerRepository`; on first transition to complete for a task with `bounty.amount > 0`, inserts `task_completion` line with correlation `task-bounty:<taskId>` if none exists.
- **US4 client**: `DayPartyClient.getRewards`, `createRewardDefinition`, `getLedger`, `purchaseReward`; `parseTask` accepts optional `bounty`. Types: `ApiRewardDefinition`, `ApiLedgerEntry`, `LedgerPageResponse`.
- **Create task (US1 gap T049–T050)**: Web `CreateTaskPanel` posts via `DayPartyClient.createTask` with `scheduledDate` = rundown date (`todayLocalDateString` / same as `getRundown`), required `title` + `size` (1–5), optional `estimatedMinutes` and `essentiality`; on success clear title/minutes and call shared `load()`. Mobile mirrors the contract in `rundown-view` (Spanish labels), mutual-exclusive Esencial/Opcional switches, then `loadRundown()`.
- **Task notes (US3)**: `Task.notesMarkdown` optional; rundown rows are `TaskRundownItem` from `taskToRundownItem` (drops full notes, adds `notesPreview` from first line, max 120 chars + `…`). `GET /api/tasks/:id` returns full task including `notesMarkdown` (route after `/reorder`, still before `PATCH /:id`). Mongo `update` uses `$unset` for `notesMarkdown` when clearing (`''` in domain update). API client: `TaskRundownItemResponse` for rundown rows, `TaskResponse` / `getTask` for detail; `parseRundownTaskRow` strips any stray `notesMarkdown` in list JSON. Web: collapsible `TaskNotesPanel` with `react-markdown` preview.
- **User preferences Mongo**: Collection `user_preferences`; documents are `UserPreferences` fields plus internal `_id`; query and upsert by `userId`. `put` uses `updateOne` when a row exists, else `insertOne` (avoids `replaceOne` typing issues with `WithoutId`).
- **Core models**: Prefer `Partial<Record<TaskSize, number>>` for optional size→minutes maps aligned with `TaskSize` in `SIZE_SCALE`.
- **`computeDayFit`**: Greedy pack in task order; `plannedMinutes` sums effective minutes for **incomplete** tasks only; completed tasks are always `inRunwayTaskIds` and use no runway minutes; `overflowUnresolved` when any incomplete **essential** task is outside the runway. Default size→minutes: 15/25/40/55/75 for sizes 1–5; overridden by prefs `sizeToMinutes`.
- **`DEFAULT_SIZE_TO_MINUTES`**: Single export from `@dayparty/core` for domain fit + Mongo read-path legacy fill; keep aligned.
- **Prefs Zod**: `patchUserPreferencesSchema` / `dayWindowSchema` enforce midnight-crossing vs same-day window rules; `sizeToMinutes` patch uses strict keys `1`–`5` only.
- **Prefs HTTP**: `GET` / `PATCH /api/me/preferences` (session auth). Response body omits `userId`. `GET` synthesizes defaults from `@dayparty/core` when no Mongo doc exists (not persisted until `PATCH`). `PATCH` merges `sizeToMinutes` shallowly over any stored overrides.
- **Web rundown**: `RundownPage` holds full `DayRundownResponse`; plan bar uses `plannedMinutes` / `availableMinutes`; day window uses `<input type="time" step={300}>` + `minutesToTimeInput` / `timeInputToMinutes` helpers; `TaskCard` takes explicit `runwayPlacement` from `dayFit` task id lists.
- **Mobile rundown**: Spanish copy for plan footnote and runway labels (`En ventana` / `Extra`); `metaLine` shows estimate, size, essentiality.
- **Task lifecycle (US2)**: `Task.status` is required on the core type; Mongo normalizes legacy rows (`isComplete` → `done`, else stored `status` or `planned`). `skipped` tasks do not consume runway minutes in `computeDayFit` (`taskCountsTowardRunwayMinutes`).
- **Triage API**: `POST /api/tasks/:id/triage` body discriminated by `action`: `defer_to_date` (moves `scheduledDate`, appends `position` on target day), `demote`, `mark_skipped`, `clear_skipped`. `PATCH /api/tasks/:id` also accepts `status` / `deferredToDate` with Zod refiners. Suggestions: `GET /api/tasks/suggestions?fromDate=&toDate=` (max 14-day span) returns `hints` where `remainingMinutes >= 30`.
- **Web triage**: `TaskTriageBar` under tasks that are outside the runway, when `overflowUnresolved`, or when status is `skipped`; loads suggestions for list date +7 days for the date picker hint.
- **Web task edit (T051)**: `TaskEditPanel` (`<details>` under each rundown row) loads `getTask` when opened, saves via `updateTask` with `UpdateTaskInput`: title, size, optional minutes (omit field when blank — does not unset Mongo estimate), essentiality, `tagKey` `null` for none, `scheduledDate`, `status` (+ `deferredToDate` when `deferred`), bounty `{ amount, tagKeys?, highResistance? }` or `bounty: null` / “Remove bounty” when a bounty existed. Tag labels use `TagResponse.displayName`.

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

## Iteration 5 - 2026-04-02

**User Story**: Partial progress on US1 — API + client for prefs and documented task rundown (T011–T013)

**Tasks Completed**:

- [x] T011: Module comment on `apps/api/src/routes/tasks.ts` for P1 rundown/task fields; create/update already validated and wired.
- [x] T012: `apps/api/src/routes/preferences.ts`, mount `/api/me/preferences` in `app.ts`, `getUserPreferences` / `patchUserPreferences` on `ApiEnv` and composition root.
- [x] T013: `DayPartyClient.getUserPreferences`, `patchUserPreferences`, `parseUserPreferences`; export `UserPreferencesResponse` / `PatchUserPreferencesInput`.

**Tasks Remaining in Story**: 2 (T014–T015)

**Commit**: 520ce51fef64d9eac16f4c6f5db31d06588d7f8a

**Files Changed**:

- `packages/domain/src/actions/user-preferences-actions.ts`
- `packages/domain/src/index.ts`
- `apps/api/src/types.ts`
- `apps/api/src/app.ts`
- `apps/api/src/index.ts`
- `apps/api/src/routes/preferences.ts`
- `apps/api/src/routes/tasks.ts`
- `packages/api-client/src/client.ts`
- `packages/api-client/src/index.ts`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- Empty `PATCH` body `{}` passes Zod but is rejected at the handler with 422 so clients get a clear error; client mirrors the same check before `request`.

---

## Iteration 6 - 2026-04-02

**User Story**: User Story 1 (Phase 3) — **complete** (T014–T015; MVP day planning slice)

**Tasks Completed**:

- [x] T014: Web `RundownPage` plan panel + window editor + `TaskCard` runway / essentiality / minutes UI.
- [x] T015: NativeScript rundown plan footnote + per-row meta and runway labels.

**Tasks Remaining in Story**: None — US1 complete (later phases in `tasks.md` still open).

**Commit**: 8d180c6a2713145f11c829ed1d7090a37354bc77

**Files Changed**:

- `apps/web/src/utils/time-of-day.ts`
- `apps/web/src/pages/RundownPage.tsx`
- `apps/web/src/pages/RundownPage.module.css`
- `apps/web/src/components/TaskCard.tsx`
- `apps/web/src/components/TaskCard.module.css`
- `apps/mobile/src/views/rundown-view.ts`
- `apps/mobile/src/views/rundown-view.xml`
- `apps/mobile/src/app.css`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- Full US1 checklist in Phase 3 is done; US2+ tasks remain elsewhere in `tasks.md` — Ralph `COMPLETE` only when **all** feature tasks are checked.

---

## Iteration 7 - 2026-04-02

**User Story**: User Story 2 — Triage overflow and move work (T016–T020)

**Tasks Completed**:

- [x] T016: `TaskStatus`, `status`, `deferredToDate` on `Task`; Mongo normalization; Zod `taskStatusSchema` on update
- [x] T017: `makeApplyTaskTriageAction`, extended `makeUpdateTaskAction` lifecycle merge; `skipped` excluded from runway load in `computeDayFit`; toggle completion syncs `status`
- [x] T018: `POST /api/tasks/:id/triage`, extended `PATCH /api/tasks/:id` validation
- [x] T019: `makeSuggestDayCapacitiesAction`, `GET /api/tasks/suggestions`
- [x] T020: `TaskTriageBar`, rundown integration, `DayPartyClient.triageTask` / `getDaySuggestions`

**Tasks Remaining in Story**: None — US2 slice in `tasks.md` complete (Phase 10 T043 still open for mobile parity)

**Commit**: 582d6521702c6f47fc5d14e51312ec79731d761b

**Files Changed**:

- `packages/core/src/models/task.ts`, `packages/core/src/index.ts`
- `packages/domain/src/day-fit.ts`, `packages/domain/src/day-suggestions.ts`, `packages/domain/src/index.ts`
- `packages/domain/src/actions/update-task.ts`, `packages/domain/src/actions/toggle-task-completion.ts`, `packages/domain/src/actions/create-task.ts`, `packages/domain/src/actions/triage-task.ts`
- `packages/domain/src/actions/*.test.ts`, `packages/domain/src/day-fit.test.ts`
- `packages/validation/src/schemas/task.ts`
- `packages/db/src/repositories/task-repository.ts`
- `packages/api-client/src/client.ts`, `packages/api-client/src/index.ts`
- `apps/api/src/types.ts`, `apps/api/src/index.ts`, `apps/api/src/routes/tasks.ts`, `apps/api/src/seed.ts`
- `apps/web/src/pages/RundownPage.tsx`, `apps/web/src/components/TaskCard.tsx`, `apps/web/src/components/TaskCard.module.css`
- `apps/web/src/components/TaskTriageBar.tsx`, `apps/web/src/components/TaskTriageBar.module.css`, `apps/web/src/utils/today-local.ts`
- `apps/mobile/src/views/rundown-view.ts`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- Register `GET /suggestions` before any future `GET /:id` on the tasks router; static paths first.
- NativeScript `EventData.object` needs `as unknown as { checked: boolean }` for strict `tsc` on the window checkbox handler.

---

## Iteration 8 - 2026-04-02

**User Story**: User Story 3 — Richer notes on actionables (T021–T023)

**Tasks Completed**:

- [x] T021 [P] [US3]: `notesMarkdown` on `Task`, Zod + Mongo mapping; rundown omits body via `TaskRundownItem`
- [x] T022 [US3]: `GET /api/tasks/:id` with correct route order; rundown uses `notesPreview` only
- [x] T023 [US3]: `TaskNotesPanel` + `RundownPage` integration with `react-markdown` preview

**Tasks Remaining in Story**: None — story complete

**Commit**: 45e09cbe452089efb4ab344886e2beaaa464f3da

**Files Changed**:

- `packages/core/src/models/task.ts`, `packages/core/src/models/task-rundown.ts`, `packages/core/src/models/day-rundown.ts`, `packages/core/src/index.ts`
- `packages/domain/src/actions/get-rundown.ts`, `reorder-tasks.ts`, `create-task.ts`, `update-task.ts`, `get-rundown.test.ts`
- `packages/validation/src/schemas/task.ts`
- `packages/db/src/repositories/task-repository.ts`
- `apps/api/src/routes/tasks.ts`
- `packages/api-client/src/client.ts`, `packages/api-client/src/index.ts`
- `apps/web/package.json`, `pnpm-lock.yaml`, `apps/web/src/components/TaskNotesPanel.tsx`, `TaskNotesPanel.module.css`, `TaskCard.tsx`, `TaskCard.module.css`, `TaskTriageBar.tsx`, `RundownPage.tsx`, `OngoingPage.tsx`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- Hono keeps `GET /suggestions` before `GET /:id` so `suggestions` is never parsed as an id.
- Closing the notes panel resets `loaded` so the next open refetches (stays aligned after rundown reload).

---

## Iteration 9 - 2026-04-02

**User Story**: Gap closure — Create actionable on web + mobile (T049, T050)

**Tasks Completed**:

- [x] T049 [P] [US1]: `CreateTaskPanel` + `RundownPage` integration; `createTask` + refetch `load()`
- [x] T050 [P] [US1]: Create form in `rundown-view.xml` / `rundown-view.ts`; same payload shape; `loadRundown()` on success

**Tasks Remaining in Story**: None — gap closure complete

**Commit**: 16d8a80693149a9eea4e9429419126ec6e50f956

**Files Changed**:

- `apps/web/src/components/CreateTaskPanel.tsx`
- `apps/web/src/components/CreateTaskPanel.module.css`
- `apps/web/src/pages/RundownPage.tsx`
- `apps/mobile/src/views/rundown-view.ts`
- `apps/mobile/src/views/rundown-view.xml`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- `createTaskSchema` requires `size` (1–5) and `scheduledDate` even when `estimatedMinutes` is set; omit minutes to let the API infer from size mapping.

---

## Iteration 10 - 2026-04-02

**User Story**: Partial progress on US4 — parallel foundation (T024, T025)

**Tasks Completed**:

- [x] T024 [P] [US4]: `RewardDefinition`, `LedgerEntry` (+ reasons/types), `TaskBounty` / `Task.bounty`; core exports
- [x] T025 [P] [US4]: `RewardDefinitionRepository`, `LedgerRepository` (+ list params/result); domain index exports

**Tasks Remaining in Story**: 5 (T026–T030)

**Commit**: ec891e6daf500a3a8dd576909f84391c2880a0e0

**Files Changed**:

- `packages/core/src/models/reward.ts`
- `packages/core/src/models/ledger.ts`
- `packages/core/src/models/task.ts`
- `packages/core/src/index.ts`
- `packages/domain/src/interfaces/reward-definition-repository.ts`
- `packages/domain/src/interfaces/ledger-repository.ts`
- `packages/domain/src/index.ts`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- **T024** and **T025** were implemented by two parallel subagents; the domain agent used temporary duplicate types when core was not visible yet — reconciled to `import type` + `export type { … } from '@dayparty/core'` so `LedgerEntryReason` is the single reason enum name (replacing a stub `LedgerReason`).
- Next US4 slice: **T026** Mongo repos (`reward_definitions`, `ledger_entries` collections per data-model) before domain actions and routes.

---

## Iteration 11 - 2026-04-02

**User Story**: User Story 4 — Rewards, bounties, marketplace (T026–T030)

**Tasks Completed**:

- [x] T026: `MongoRewardDefinitionRepository`, `MongoLedgerRepository`; export from `@dayparty/db`
- [x] T027: Bounty grant in `makeUpdateTaskAction` + `purchase-reward.ts`, `get-ledger-page.ts`, reward catalog actions
- [x] T028: `rewards.ts`, `ledger.ts`, `marketplace.ts` routes; `ApiEnv` wiring in `apps/api`
- [x] T029: `DayPartyClient` rewards/ledger/purchase + bounty in `parseTask`; package exports
- [x] T030: `RewardsPage` + `/rewards` route; rundown header link

**Tasks Remaining in Story**: None — US4 web + API slice complete (mobile parity remains T045)

**Commit**: 7b628b71472172fe236a491e94a9f97c866f3188

**Files Changed**:

- `packages/db/src/repositories/reward-definition-repository.ts`
- `packages/db/src/repositories/ledger-repository.ts`
- `packages/db/src/repositories/task-repository.ts`
- `packages/db/src/index.ts`
- `packages/domain/src/interfaces/ledger-repository.ts`
- `packages/domain/src/actions/update-task.ts`
- `packages/domain/src/actions/create-task.ts`
- `packages/domain/src/actions/reward-definition-actions.ts`
- `packages/domain/src/actions/get-ledger-page.ts`
- `packages/domain/src/actions/purchase-reward.ts`
- `packages/domain/src/index.ts`
- `packages/validation/src/schemas/task.ts`
- `packages/validation/src/schemas/rewards.ts`
- `packages/validation/src/index.ts`
- `packages/api-client/src/client.ts`
- `packages/api-client/src/index.ts`
- `apps/api/src/types.ts`
- `apps/api/src/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/routes/rewards.ts`
- `apps/api/src/routes/ledger.ts`
- `apps/api/src/routes/marketplace.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/pages/RewardsPage.tsx`
- `apps/web/src/pages/RewardsPage.module.css`
- `apps/web/src/pages/RundownPage.tsx`
- `apps/web/src/pages/RundownPage.module.css`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- Ledger pagination cursor: base64url of `createdAt` + unit-separator + hex `_id`; query uses `$or` tie-break for descending `(createdAt, _id)`.
- `costCurrency` 0 is allowed for free rewards; purchase still inserts a ledger line with `amount: 0` (no-op debit) — acceptable v1 or tighten later.

---

## Iteration 12 - 2026-04-02

**User Story**: Partial progress on gap closure — task editor / focus / bounty (T051)

**Tasks Completed**:

- [x] T051 [US1]: `TaskEditPanel` + `RundownPage` wiring; `getTask` / `updateTask` for full edit field set (incl. bounty set/clear, deferred + date)

**Tasks Remaining in Story**: 5 (T052–T056 in gap-closure block)

**Commit**: e94d86e67cfb590cfa1d4c09a6381e2165705237

**Files Changed**:

- `apps/web/src/components/TaskEditPanel.tsx`
- `apps/web/src/components/TaskEditPanel.module.css`
- `apps/web/src/pages/RundownPage.tsx`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- Empty “Est. minutes” omits `estimatedMinutes` on PATCH so existing stored estimates are unchanged (no `$unset` path in task repo for that field).
- Bounty updates replace the whole subdocument; omitting `highResistance` on a new `{ amount }` clears a previously set flag when the stored object is overwritten.

---

## Iteration 13 - 2026-04-02

**User Story**: Gap closure — US1 focus + mobile task editor (**T052**, **T054**, **T055**)

**Tasks Completed**:

- [x] T052 [US1]: Web **Start** / **Pause** on `TaskCard` + `RundownPage`; `OngoingPage` prefers `in_progress` and toggles `planned` ↔ `in_progress` via `updateTask`
- [x] T054 [US1]: Mobile `task-detail-view` (mirror **T051** field set + notes + bounty), **Editar** from rundown, `navigateToTaskDetail` in `auth-state`
- [x] T055 [US1]: Mobile rundown **Enfoque** / **Pausa** + `ongoing-view` parity

**Tasks Remaining in Story**: None — **T053** / **T056** are US4 tasks in the same gap block (not part of this US1 story)

**Commit**: e9de6cbe9fbeb3cbc10579d47aa334eb04437b6a

**Files Changed**:

- `apps/web/src/components/TaskCard.tsx`
- `apps/web/src/components/TaskCard.module.css`
- `apps/web/src/pages/RundownPage.tsx`
- `apps/web/src/pages/OngoingPage.tsx`
- `apps/web/src/pages/OngoingPage.module.css`
- `apps/mobile/src/services/auth-state.ts`
- `apps/mobile/src/views/rundown-view.ts`
- `apps/mobile/src/views/rundown-view.xml`
- `apps/mobile/src/views/ongoing-view.ts`
- `apps/mobile/src/views/ongoing-view.xml`
- `apps/mobile/src/views/task-detail-view.ts`
- `apps/mobile/src/views/task-detail-view.xml`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- Rundown list rows use per-row `tap` handlers (`onToggleComplete` on status icon, **Editar** / **Enfoque** buttons) instead of `ListView.itemTap` so inner buttons do not conflict with row-level toggle.
- Mobile `task-detail` save always sends `notesMarkdown` from the `TextView` (aligned with full-detail surface; web still splits notes via `TaskNotesPanel`).

---

## Iteration 14 - 2026-04-02

**User Story**: Gap closure — US4 web bounty on create (**T053**)

**Tasks Completed**:

- [x] T053 [P] [US4]: `CreateTaskPanel` optional bounty (amount 1–1M, comma-separated `tagKeys`, `highResistance`); payload matches `createTaskSchema`; clear bounty fields on success; matrix row updated

**Tasks Remaining in Story**: Gap block still has **T056** (mobile bounty on create/edit); other phases unchanged

**Commit**: c76713c31aea005c8f500e3e83561ce02ea3d24d

**Files Changed**:

- `apps/web/src/components/CreateTaskPanel.tsx`
- `apps/web/src/components/CreateTaskPanel.module.css`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- Reuse the same bounty validation rules as `TaskEditPanel` (integer amount range, `parseBountyTagKeys`); omit `bounty` from `createTask` body when amount field is empty.

---
