# Ralph Progress Log

Feature: 003-vision-aligned-rebuild
Started: 2026-04-02 15:10:01

## Codebase Patterns

- **Mobile rewards (T045 / US4)**: `views/rewards-view` loads `getRewards` + `getLedger({ limit: 30 })` in parallel; **Comprar** uses `purchaseReward`; create form uses `createRewardDefinition` (Spanish copy). **Repeater** (not nested **ListView**) inside **ScrollView** for catalog + ledger rows. `authState.navigateToRewards()`; rundown **ActionBar** **Recompensas** `ActionItem`. `.reward-touch` **min-height: 48** for marketplace buttons. Shell route list in `app.ts` file comment.
- **Mobile notes (T044 / US3)**: Rundown `TaskRow` includes optional `notesPreviewLine` + `notesPreviewVisibility` from `TaskRundownItemResponse.notesPreview`; **Notas** → `authState.navigateToTaskDetail(taskId, { notesFocus: true })`. `task-detail-view` reads `context.notesFocus`, sets `pageTitle` **Notas** vs **Editar tarea**, `notesEditorHeight` 220 vs 150; notes **TextView** after **Título** with `.notes-text` (monospace) and short helper copy.
- **Quickstart (Phase 9 T042/T048)**: `specs/003-vision-aligned-rebuild/quickstart.md` documents API env vars (`MONGODB_*`, `PORT`, `API_PUBLIC_URL`, `WEB_PUBLIC_URL`, `CORS_ORIGIN`, `MAGIC_LINK_SECRET`), auth → JWT flow, curl samples for tasks/prefs/triage/suggestions/rewards/ledger/marketplace/history, **FR-011** cross-session checklist, and **Session / offline (v1)** scope (server-authoritative; retry + refresh; no offline queue / merge UI in 003 v1).
- **Mobile triage (T043)**: `rundown-view` ListView rows include a collapsible triage block (`triageVisibility`) when `showTriageForTask` matches web (`skipped` | `overflowUnresolved` | `outsideRunwayTaskIds`). Uses `DayPartyClient.triageTask` + `getDaySuggestions` (7-day window); `TaskRow` holds `moveDateInput` / `moveHint`; `textChange` on `TextField` + `ObservableArray.setItem` updates hint and `moveEnabled`; `refreshTriageBusy` disables actions on the in-flight row only. Spanish copy; triage buttons `min-height: 44` in `app.css`.
- **Plan history (US6 T034–T039)**: `PlanHistoryEvent` in `@dayparty/core`; `PlanHistoryRepository.append` / `listByUserId` in `@dayparty/domain`; Mongo `plan_history_events` with base64url cursor embedding `order` + `timestamp` + `_id` (matches asc/desc). Domain actions take `historyRepo`: create/update/reorder/delete/triage, `patchUserPreferences`, `createRewardDefinition`, `purchaseReward`. **Idempotency**: `append` optional `correlation` + pre-insert `findOne` by `{ userId, correlation }` for bounty credit (`history-bounty:task-bounty:<taskId>`) and purchase (`history-purchase:<ledger correlation>`). API `GET /api/history?limit=&cursor=&order=` omits `userId` on events; client `getHistory` + `PlanHistoryPanel` (collapsible on `RundownPage`).
- **US5 visual presets (T031–T033)**: `DEFAULT_VISUAL_PRESET` in `@dayparty/core`; domain prefs actions already synthesize full `UserPreferences` on GET when no doc; Mongo `docToPrefs` fills missing `visualPreset` / `dayWindow` for legacy rows. Web: `apps/web/src/styles/presets.css` defines `:root.preset-{calm,playful,highContrast}` token maps (default = no class, base vars in `index.css`); `VisualPresetProvider` (`context/visual-preset-context.tsx`) wraps protected routes, applies classes from `getUserPreferences` / `patchUserPreferences`; rundown **Day window** `<details>` includes **Look & feel** `<select>`. Shared `--dp-on-accent` for text on accent-filled buttons (high-contrast preset uses yellow accent + dark label).
- **Mobile bounty on create (T056)**: `rundown-view` optional recompensa block mirrors web `CreateTaskPanel`: integer amount 1–1M, comma-separated scope tags, **Alta resistencia**; omitted from `createTask` when amount empty. `task-detail-view` `onSave`: `clearBounty` → `bounty: null` (aligned with `TaskEditPanel`, not gated on `hadBounty`).
- **Create task bounty (T053)**: Web `CreateTaskPanel` optional bounty block: amount (points), comma-separated scope tags, **High resistance** checkbox; omitted from POST when amount empty; same bounds as `taskBountySchema` / `TaskEditPanel`.
- **Focus `planned` ↔ `in_progress` (T052 / T055)**: Web `TaskCard` exposes optional `onToggleFocus` + `focusBusy`; `RundownPage` calls `updateTask` with flipped `status`; `OngoingPage` prefers the first incomplete task with `status === 'in_progress'`, then offers **Start** / **Pause** (`updateTask`). Mobile rundown rows use **Enfoque** / **Pausa** (`toggleFocusFor`); `ongoing-view` mirrors pick + toggle. **In progress** badge on web `TaskCard` (`focusTag`).
- **Mobile task detail (T054)**: `apps/mobile/src/views/task-detail-view.{ts,xml}` — `authState.navigateToTaskDetail(taskId, { notesFocus? })` passes `Frame` `context`; `onNavigatingTo` reads `args.context` / `page.navigationContext`. Full edit + `notesMarkdown` + bounty (Spanish copy); `ListPicker` for status / essentiality / tag; `Observable.propertyChangeEvent` on `statusIndex` toggles deferred date visibility.
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

## Iteration 15 - 2026-04-02

**User Story**: Gap closure — US4 mobile bounty on create (**T056**); task-detail bounty clear aligned with web

**Tasks Completed**:

- [x] T056 [P] [US4]: Mobile optional **bounty** on create (`rundown-view` + `createTask`); **edit/clear** already in **T054** `task-detail-view` — aligned clear path with `TaskEditPanel`

**Tasks Remaining in Story**: None — gap-closure **T051–T056** complete; Phase 7+ tasks remain in `tasks.md`

**Commit**: e681f420e6b5b66f9c85e23b9076ccef2ecd706c

**Files Changed**:

- `apps/mobile/src/views/rundown-view.ts`
- `apps/mobile/src/views/rundown-view.xml`
- `apps/mobile/src/views/task-detail-view.ts`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- NativeScript `Switch` for `newTaskBountyHighResistance` uses two-way `checked="{{ ... }}"` like window crosses; no `checkedChange` handler needed for create flow.

---

## Iteration 16 - 2026-04-02

**User Story**: User Story 5 — Visual presets (T031–T033)

**Tasks Completed**:

- [x] T031 [US5]: Verified prefs pipeline; exported `DEFAULT_VISUAL_PRESET`; Mongo `docToPrefs` normalizes missing `visualPreset` / `dayWindow`; API route comment for GET defaults / PATCH merge
- [x] T032 [P] [US5]: `presets.css` calm / playful / highContrast maps; `body` 16px baseline; `--dp-on-accent`; primary shell touch targets (rundown header + save window)
- [x] T033 [US5]: `VisualPresetProvider` + rundown **Look & feel** selector bound to preferences API

**Tasks Remaining in Story**: None — US5 web slice complete (**T046** mobile still open in Phase 10)

**Commit**: 6acb388b3bfcd0bb12e74ae35d6ee47547e260f9

**Files Changed**:

- `packages/core/src/models/user-preferences.ts`, `packages/core/src/index.ts`
- `packages/domain/src/actions/user-preferences-actions.ts`
- `packages/db/src/repositories/user-preferences-repository.ts`
- `apps/api/src/routes/preferences.ts`
- `apps/web/src/styles/presets.css`, `apps/web/src/context/visual-preset-context.tsx`, `apps/web/src/App.tsx`, `apps/web/src/main.tsx`, `apps/web/src/index.css`
- `apps/web/src/pages/RundownPage.tsx`, `RundownPage.module.css`
- `apps/web/src/components/*.module.css`, `LoginPage.module.css`, `OngoingPage.module.css`, `RewardsPage.module.css`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- `:root.preset-*` shares the same element as `:root`; non-default presets add a single class; `default` clears preset classes so base `index.css` tokens apply.
- High-contrast yellow accent needs `--dp-on-accent` (dark text) on filled primary buttons site-wide.

---

## Iteration 17 - 2026-04-02

**User Story**: User Story 6 — Plan change history (T034–T039)

**Tasks Completed**:

- [x] T034 [P] [US6]: `PlanHistoryEvent` + `PlanHistoryRepository` port; package exports
- [x] T035 [US6]: `MongoPlanHistoryRepository` (`plan_history_events`), `@dayparty/db` export
- [x] T036 [US6]: History from create/update/reorder/delete/triage/prefs/reward mutations; correlation dedup for bounty + purchase
- [x] T037 [P] [US6]: `GET /api/history`, `ApiEnv.getHistoryPage`, app mount
- [x] T038 [P] [US6]: `DayPartyClient.getHistory`, `historyQuerySchema`, response types
- [x] T039 [US6]: `PlanHistoryPanel` + `RundownPage` integration

**Tasks Remaining in Story**: None — story complete

**Commit**: 50448a48e7c27b1f456b0aa9b36fca4899b7e294

**Files Changed**:

- `packages/core/src/models/plan-history.ts`, `packages/core/src/index.ts`
- `packages/domain/src/interfaces/plan-history-repository.ts`, `actions/get-history-page.ts`, `actions/*.ts` (history wiring), `*.test.ts` noop history fakes
- `packages/db/src/repositories/plan-history-repository.ts`, `packages/db/src/index.ts`
- `packages/validation/src/schemas/history.ts`, `packages/validation/src/index.ts`
- `packages/api-client/src/client.ts`, `packages/api-client/src/index.ts`
- `apps/api/src/routes/history.ts`, `apps/api/src/app.ts`, `apps/api/src/index.ts`, `apps/api/src/types.ts`
- `apps/web/src/components/PlanHistoryPanel.tsx`, `PlanHistoryPanel.module.css`, `apps/web/src/pages/RundownPage.tsx`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- Vitest domain tests need an in-memory `PlanHistoryRepository` when actions gain a history dependency.
- `task.updated` is skipped when a PATCH produces no diff in the summarized fields (avoids empty noise).

---

## Iteration 18 - 2026-04-02

**User Story**: User Story 2 — NativeScript triage parity (**T043**)

**Tasks Completed**:

- [x] T043 [P] [US2]: Triage / defer / move-day on mobile `rundown-view` + `rundown-view.xml` (`triageTask`, suggestions hints, Spanish UI)

**Tasks Remaining in Story**: None — **T043** complete; Phase 9 polish (**T040**–**T042**, **T048**) and Phase 10 **T044**–**T047** remain

**Commit**: 9438ccd3a8457ac3e684780b76e363da59c7adf5

**Files Changed**:

- `apps/mobile/src/views/rundown-view.ts`
- `apps/mobile/src/views/rundown-view.xml`
- `apps/mobile/src/app.css`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- ListView item `TextField` `textChange` must update the row via `ObservableArray.setItem` so `moveHint` / `moveEnabled` refresh; `runTriageFor` uses `try/finally` + `refreshTriageBusy` so buttons re-enable after errors.

---

## Iteration 19 - 2026-04-02

**User Story**: Phase 9 — Polish & cross-cutting (**T040**–**T042**, **T048**)

**Tasks Completed**:

- [x] T040 [P]: `pnpm build` at repo root — green (no TS fixes required)
- [x] T041 [P]: `pnpm test` at repo root — green (domain Vitest; `@dayparty/api` has no `test` script)
- [x] T042 [P]: Refreshed `quickstart.md` — env vars, auth/JWT, curl for shipped routes, **FR-011** checklist
- [x] T048 [P]: **Session / offline (v1)** subsection in `quickstart.md` per `spec.md` assumptions

**Tasks Remaining in Story**: None — Phase 9 complete; Phase 10 (**T044**–**T047**) remains

**Commit**: bb17086f0f64422bbdd4d29a58edaee7fb8f2f07

**Files Changed**:

- `specs/003-vision-aligned-rebuild/quickstart.md`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- Pre-commit Prettier may reformat `quickstart.md` on commit; root `pnpm test` does not run API package tests until a `test` script exists there.

---

## Iteration 20 - 2026-04-02

**User Story**: Phase 10 — US3 mobile notes (**T044**)

**Tasks Completed**:

- [x] T044 [P] [US3]: Rundown **Notas** + `notesPreview` line; `navigateToTaskDetail` `notesFocus`; task-detail notes block promoted under title with monospace editor and contextual title/height

**Tasks Remaining in Story**: None — story complete

**Commit**: a3f40bde646304dc8f57b3d41985e2f2b87ea367

**Files Changed**:

- `apps/mobile/src/services/auth-state.ts`
- `apps/mobile/src/views/rundown-view.ts`
- `apps/mobile/src/views/rundown-view.xml`
- `apps/mobile/src/views/task-detail-view.ts`
- `apps/mobile/src/views/task-detail-view.xml`
- `apps/mobile/src/app.css`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- Kept a single **task-detail** route per T044 vs T054 guidance; **Notas** is an entry point + `notesFocus` UX, not a second screen.

---

## Iteration 21 - 2026-04-02

**User Story**: Phase 10 — US4 mobile rewards (**T045**)

**Tasks Completed**:

- [x] T045 [P] [US4]: `rewards-view.ts` / `rewards-view.xml` — balance, catalog + purchase, create reward, recent ledger; rundown entry + `navigateToRewards`; `app.ts` shell route comment

**Tasks Remaining in Story**: Phase 10 still has **T046**–**T047**

**Commit**: 1548b971ade8f0b493cc4886e9fda92e6ef6d892

**Files Changed**:

- `apps/mobile/src/views/rewards-view.ts`
- `apps/mobile/src/views/rewards-view.xml`
- `apps/mobile/src/services/auth-state.ts`
- `apps/mobile/src/views/rundown-view.ts`
- `apps/mobile/src/views/rundown-view.xml`
- `apps/mobile/src/app.ts`
- `apps/mobile/src/app.css`
- `specs/003-vision-aligned-rebuild/tasks.md`

**Learnings**:

- Use `result.ok === false` before reading `Result.error` so TypeScript narrows (same as other mobile views).
- Avoid **ListView** inside **ScrollView**; **Repeater** + **ObservableArray** keeps one scroll container.

---
