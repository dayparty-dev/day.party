# Tasks: Vision-aligned day planning rebuild

**Input**: Design documents from `/specs/003-vision-aligned-rebuild/`
**Prerequisites**: [`plan.md`](./plan.md), [`spec.md`](./spec.md), [`research.md`](./research.md), [`data-model.md`](./data-model.md), [`contracts/day-planning-rest.md`](./contracts/day-planning-rest.md), [`quickstart.md`](./quickstart.md)

**Tests**: **Not included** — the feature spec does not mandate TDD; add Vitest coverage for `computeDayFit` and critical routes opportunistically per [`plan.md`](./plan.md) (pragmatic quality).

**Organization**: Phases follow spec user-story priorities (P1–P6). Implementation is **spec-driven**; `apps/web-legacy/` is not a source of truth ([`/.specify/memory/constitution.md`](../../.specify/memory/constitution.md)).

**Terminology**: Spec **Actionable** ≡ TypeScript **`Task`** in packages and REST (see [`research.md`](./research.md) §1).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label ([US1]…[US6]) on user-story phase tasks only
- Include exact file paths in descriptions

### Product story-done vs web-only slice

Per `spec.md` (**Mobile / web parity** and **Definition of done (first-party clients)**), a user story is **product-done** only when **both** `apps/web` and `apps/mobile` ship that story’s **intended** UX—not merely when the API accepts payloads.

- **US2** / **US3**: **Web + API** slices (**T016–T023**, **T020**, **T023**) are `[x]`; **mobile** triage/notes are **T043** / **T044** (Phase 10). Until those are `[x]`, US2/US3 are **web slice complete**, not product-closed.
- **US4**: **Web** marketplace (**T030**) shipped without **mobile** rewards (**T045**) or **bounty** create/edit in clients (**T053**, **T056**, **T051**/`T054`). Until **T045** + **T053** + **T056** + editor bounty paths are `[x]`, treat US4 as **web/API slice complete**, not product-closed.
- **US1**: **Full lifecycle** (edit fields, **`in_progress`**, optional **bounty** on create/edit, not only done-toggle) requires **T051–T056** in addition to earlier US1 tasks.

### API ↔ client coverage matrix (003)

| Capability (REST / client)                                                                         | Web today                  | Mobile today       | Product-complete when      | Task IDs                     |
| -------------------------------------------------------------------------------------------------- | -------------------------- | ------------------ | -------------------------- | ---------------------------- |
| `PATCH` **title**, **size**, **estimatedMinutes**, **essentiality**, **tagKey**, **scheduledDate** | Exposed (**T051**)         | Exposed (**T054**) | Both clients               | —                            |
| `PATCH` **status** `planned` ↔ `in_progress` (“focus / pause”)                                     | Exposed (**T052**)         | Exposed (**T055**) | Both clients               | —                            |
| `PATCH` **status** / **deferredToDate** (`deferred`)                                               | Partial (via triage defer) | Not exposed        | Both + editor where needed | **T051**, **T054**, **T043** |
| **Triage** (`POST …/triage`)                                                                       | Exposed (**T020**)         | Not exposed        | Mobile                     | **T043**                     |
| **Notes** detail (`GET :id`, `PATCH` notes)                                                        | Exposed (**T023**)         | Not exposed        | Mobile                     | **T044**                     |
| **Bounty** create (`POST` + `createTaskSchema.bounty`)                                             | Exposed (**T053**)         | Exposed (**T056**) | Both                       | —                            |
| **Bounty** edit/clear (`PATCH` bounty)                                                             | Exposed (**T051**)         | Exposed (**T054**) | Both                       | —                            |
| Rewards / ledger / purchase                                                                        | Exposed (**T030**)         | Not exposed        | Mobile                     | **T045**                     |

_Update this table when `updateTaskSchema` or routes gain fields._

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Make 003 artifacts discoverable from the spec and ready for implementation traceability.

- [x] T001 [P] Add a **Related artifacts** subsection near the top of `specs/003-vision-aligned-rebuild/spec.md` linking [`plan.md`](./plan.md), [`tasks.md`](./tasks.md), [`data-model.md`](./data-model.md), and [`contracts/day-planning-rest.md`](./contracts/day-planning-rest.md) _(satisfied by post-analyze spec edit; re-verify if spec is moved)_

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared **user preferences** types, persistence port, and API wiring so P1 (day window + fit) and P5 (visual preset) can reuse the same document without rework.

**⚠️ CRITICAL**: Complete before **User Story 1** implementation tasks that read or write the daily window.

- [x] T002 [P] Add `DayWindow` and `UserPreferences` types in `packages/core/src/models/user-preferences.ts` and export them from `packages/core/src/index.ts` per `specs/003-vision-aligned-rebuild/data-model.md`
- [x] T003 [P] Add `UserPreferencesRepository` in `packages/domain/src/interfaces/user-preferences-repository.ts` and export from `packages/domain/src/index.ts`
- [x] T004 Implement `MongoUserPreferencesRepository` in `packages/db/src/repositories/user-preferences-repository.ts` following existing repository patterns; export from `packages/db/src/index.ts`
- [x] T005 Construct `MongoUserPreferencesRepository` in `apps/api/src/index.ts`, add `userPrefsRepo` to `ApiEnv` in `apps/api/src/types.ts` typed as `UserPreferencesRepository` from `@dayparty/domain`

**Checkpoint**: Preferences port is live in composition root — **US1** prefs routes can be added.

---

## Phase 3: User Story 1 — Shape a flexible day from actionables (Priority: P1) 🎯 MVP

**Goal**: Ordered actionables per date with **estimates**, **user-defined day window**, **fit/overflow** and **in-runway vs outside-runway** (FR-001–FR-003, FR-012, SC-001, SC-002).

**Independent Test**: From **first-party `apps/web` and `apps/mobile`** (not `apps/web-legacy` and not ad hoc `curl` alone), create ≥5 actionables for the selected date, set the day window in prefs, reorder, and observe `dayFit` / runway split in API and UI — without notes, rewards, or history features. (**T049** / **T050** MUST be `[x]` before this test passes end-to-end.)

**FR-004 traceability (partial in US1)**: **Complete** and **reopen** (toggle incomplete) are extended in **T011** with the new task model. **`skip`** and other **triage-style** transitions (defer, demote, status changes) are owned by **US2** domain/API (**T016–T018**) and web UI (**T020**); express **`skip`** via the same `Task` status / triage rules as in `data-model.md` (not a separate US1 task). **Ledger / bounty consistency** on completion is **US4 (T027)**. Stopping after US1 is an MVP demo, not full FR-004 closure.

### Implementation for User Story 1

- [x] T006 [US1] Extend `Task` and `DayRundown` in `packages/core/src/models/task.ts` and `packages/core/src/models/day-rundown.ts` with `estimatedMinutes`, priority/essentiality, and rundown fields for `dayFit` + echoed `dayWindow` per `specs/003-vision-aligned-rebuild/contracts/day-planning-rest.md`
- [x] T007 [US1] Implement `computeDayFit` (greedy pack, `overflowUnresolved` for essential overflow) in `packages/domain/src/day-fit.ts` per `specs/003-vision-aligned-rebuild/research.md`
- [x] T008 [US1] Update `makeGetRundownAction` in `packages/domain/src/actions/get-rundown.ts` to load prefs via `UserPreferencesRepository`, compute fit, and return extended rundown (depends on T005–T007)
- [x] T009 [P] [US1] Extend Zod task schemas in `packages/validation/src/schemas/task.ts` for new task fields; add `packages/validation/src/schemas/user-preferences.ts` and export from `packages/validation/src/index.ts`
- [x] T010 [P] [US1] Map new fields in `packages/db/src/repositories/task-repository.ts` with legacy-safe defaults (`estimatedMinutes` from `size` when missing) per `specs/003-vision-aligned-rebuild/research.md`
- [x] T011 [US1] Update `apps/api/src/routes/tasks.ts` to return extended rundown and accept new fields on create/update; keep existing auth and error patterns
- [x] T012 [US1] Add preferences routes (e.g. `GET`/`PATCH` user prefs) in `apps/api/src/routes/preferences.ts` and mount them from `apps/api/src/app.ts` with Zod validation at the edge
- [x] T013 [US1] Extend `DayPartyClient` in `packages/api-client/src/client.ts` for rundown shape and preferences methods; align shared types from `@dayparty/core`
- [x] T014 [US1] Implement day window controls, fit/overflow, and **runway vs outside-runway labeling** (and priority badges) in `apps/web/src/pages/RundownPage.tsx` and `apps/web/src/components/TaskCard.tsx` — **no triage actions** on this component (defer/demote/skip → US2 / **`TaskTriageBar`** on `RundownPage`)
- [x] T015 [P] [US1] Surface extended rundown and day-window feedback in `apps/mobile/src/views/rundown-view.ts` (and `apps/mobile/src/views/rundown-view.xml` as needed)

**Checkpoint**: MVP day planning + fit feedback on web and mobile **after T049–T050** — **stop here** for demo if desired (US1 product story-done still requires create UX on both clients per `spec.md`).

---

## Phase 4: User Story 2 — Triage overflow and move work (Priority: P2)

**Goal**: Defer, demote, or move items; suggested placement; overflow UX paths (FR-005, SC-003).

**Product story-done**: **US2** on the product also requires **T043** (mobile triage). The tasks below are **web + API slice** complete.

**Independent Test**: On **`apps/web`**, mark incomplete or overflowing items for tomorrow / another date / low importance; verify task dates and statuses update via API and appear correctly in rundown. **Product-complete** US2 also requires **`apps/mobile`** triage (**T043**).

### Implementation for User Story 2

- [x] T016 [US2] Add `status` / `deferredToDate` (and related enums) to `Task` in `packages/core/src/models/task.ts` per `specs/003-vision-aligned-rebuild/data-model.md`
- [x] T017 [US2] Implement triage transitions in `packages/domain/src/actions/update-task.ts` (or new `packages/domain/src/actions/triage-task.ts`) with validation rules consistent with spec acceptance scenarios
- [x] T018 [P] [US2] Extend `apps/api/src/routes/tasks.ts` (or add `apps/api/src/routes/triage.ts`) for triage payloads per `specs/003-vision-aligned-rebuild/contracts/day-planning-rest.md`
- [x] T019 [P] [US2] Add optional capacity suggestion helper and `GET` query route in `apps/api/src/routes/tasks.ts` implementing the heuristic in `specs/003-vision-aligned-rebuild/research.md` §5 (**remaining minutes vs planned load per day** only; **no unavailable/busy-period blocking** in v1 — see `spec.md` US2 and `contracts/day-planning-rest.md`)
- [x] T020 [US2] Build triage / overflow flows in `apps/web/src/pages/RundownPage.tsx` and `apps/web/src/components/TaskTriageBar.tsx` (defer, demote, skip/clear skip, capacity hints)

---

## Phase 5: User Story 3 — Richer notes on actionables (Priority: P3)

**Goal**: Persist markdown notes on tasks; scannable list + detail view (FR-006, SC-004).

**Product story-done**: **US3** on the product also requires **T044** (mobile notes). The tasks below are **web + API slice** complete.

**Independent Test**: Add long markdown to a task, reload, confirm formatting preserved and list rows stay compact.

**T044 vs T054**: **T044** is **notes-first** mobile detail (view/edit `notesMarkdown`, plain or markdown). **T054** is the **full task editor** (same field set as **T051**). **Implementation order**: ship **T054** as the single **task detail** screen and **embed** the notes editor there **or** complete **T044** first and **merge/replace** with **T054** so users do not get two competing detail entry points.

### Implementation for User Story 3

- [x] T021 [P] [US3] Add `notesMarkdown` to `Task` in `packages/core/src/models/task.ts`, validation in `packages/validation/src/schemas/task.ts`, and BSON mapping in `packages/db/src/repositories/task-repository.ts`; ensure rundown serialization **omits** `notesMarkdown` (see `contracts/day-planning-rest.md` P3)
- [x] T022 [US3] Add `GET /api/tasks/:id` in `apps/api/src/routes/tasks.ts` returning **full** task including `notesMarkdown`; ensure **route order** registers `GET /`, `PATCH /reorder`, etc. **before** `GET /:id` per `contracts/day-planning-rest.md`. Rundown **`GET /api/tasks?date=`** MUST omit `notesMarkdown` (optional `notesPreview` only per contract)
- [x] T023 [US3] Add notes editor/detail UI in `apps/web/src/components/TaskNotesPanel.tsx` and integrate from `apps/web/src/pages/RundownPage.tsx` with lightweight markdown rendering

---

## Gap closure: Create actionable (web + mobile)

**Purpose**: US1 is incomplete on greenfield clients until users can add tasks without `apps/web-legacy` or raw HTTP. **Depends on**: T011/T013 (API + `DayPartyClient.createTask` already shipped).

- [x] T049 [P] [US1] Implement create-task UX in `apps/web` (new component under `apps/web/src/components/` and/or `apps/web/src/pages/RundownPage.tsx`), calling `DayPartyClient.createTask` with **`scheduledDate`** aligned to the current rundown date and fields allowed by `createTaskSchema` (`estimatedMinutes` and/or legacy `size`, title, etc.); on success, **refetch rundown** or merge the created task per existing data-loading patterns
- [x] T050 [P] [US1] Implement create-task UX in `apps/mobile` (`apps/mobile/src/views/rundown-view.ts` + `rundown-view.xml`, or a small dedicated view + `app.ts` registration), same API contract as T049; register navigation if split into a separate view

---

## Gap closure: Task editor, focus status, and bounty (web + mobile)

**Purpose**: Close **API vs client drift**: `PATCH /api/tasks/:id` and `createTask` accept a broad task shape; first-party clients today mostly toggle **done**, **notes**, and (web-only) **triage**. **Depends on**: **T013** (`DayPartyClient` / `getTask`), **T022**, **T049**–**T050**.

- [x] T051 [US1] Web: add task **detail / edit** UI (e.g. `apps/web/src/components/TaskEditPanel.tsx` or drawer) wired from `apps/web/src/pages/RundownPage.tsx`, loading via `DayPartyClient.getTask` and saving via `updateTask` for **`title`**, **`size`**, **`estimatedMinutes`**, **`essentiality`**, **`tagKey`**, **`scheduledDate`**, **`status`** / **`deferredToDate`** when `deferred`, and **`bounty`** set or clear (align with `updateTaskSchema`; FR-008)
- [x] T052 [US1] Web: expose **Start / Pause** (or equivalent copy) for **`planned` ↔ `in_progress`** via `updateTask` on rundown and/or `apps/web/src/pages/OngoingPage.tsx` (FR-004)
- [x] T053 [P] [US4] Web: extend `apps/web/src/components/CreateTaskPanel.tsx` (**T049**) with optional **`bounty`** fields from `createTaskSchema` so new tasks can carry bounties without raw API
- [x] T054 [US1] Mobile: task **detail / edit** view (same field set as **T051**) in `apps/mobile/src/views/` (new `task-detail-view` or extend rundown), navigable from rundown, using `getTask` / `updateTask`
- [x] T055 [US1] Mobile: **`planned` ↔ `in_progress`** controls mirroring **T052** (`updateTask`)
- [x] T056 [P] [US4] Mobile: optional **`bounty`** on create in **T050** flow + edit/clear in **T054** surface (`createTask` / `updateTask`)

---

## Phase 6: User Story 4 — Rewards, bounties, marketplace (Priority: P4)

**Goal**: Bounty on completion, ledger balance, catalog purchase flow (FR-004, FR-007, FR-008, SC-005).

**Product story-done**: **US4** requires **T030** + **T045** + **T053** + **T056** + bounty path on **T051** / **T054** (see **coverage matrix**).

**Independent Test**: On **`apps/web`**, complete a bounty task → balance increases → purchase reward → ledger reflects debit. **Product-complete** US4 also requires **`apps/mobile`** rewards (**T045**) and client bounty surfaces (**T053**, **T056**, **T051** / **T054**).

### Implementation for User Story 4

- [x] T024 [P] [US4] Add `RewardDefinition` and `LedgerEntry` types in `packages/core/src/models/reward.ts` and `packages/core/src/models/ledger.ts` (or single module) and export from `packages/core/src/index.ts`
- [x] T025 [P] [US4] Add `RewardDefinitionRepository` and `LedgerRepository` ports in `packages/domain/src/interfaces/` and export from `packages/domain/src/index.ts`
- [x] T026 [US4] Implement `MongoRewardDefinitionRepository` and `MongoLedgerRepository` in `packages/db/src/repositories/`; export from `packages/db/src/index.ts`
- [x] T027 [US4] Add domain actions for granting bounty on completion and purchasing rewards in `packages/domain/src/actions/complete-task-with-rewards.ts` (or extend existing completion flow) and `packages/domain/src/actions/purchase-reward.ts` (**FR-004** completion path consistent with **FR-007/FR-008** ledger rules)
- [x] T028 [US4] Add `apps/api/src/routes/rewards.ts` and `apps/api/src/routes/ledger.ts` (or combined router) per `specs/003-vision-aligned-rebuild/contracts/day-planning-rest.md`; wire repos/actions in `apps/api/src/index.ts` and mount in `apps/api/src/app.ts`
- [x] T029 [P] [US4] Extend `packages/api-client/src/client.ts` for rewards, ledger, and task bounty fields
- [x] T030 [US4] Add minimal marketplace and balance UI in new `apps/web/src/pages/RewardsPage.tsx` and route from `apps/web/src/App.tsx`

---

## Phase 7: User Story 5 — Visual presets (Priority: P5)

**Goal**: At least two UI presets across core screens; persisted preference (FR-009, SC-006).

**Independent Test**: Switch preset; planning + triage + rewards entry points pick up tokens. Confirm **spec.md** US5 measurable bounds (≥16px body on web, ≥44×44px primary targets or native minimums on mobile).

### Implementation for User Story 5

- [x] T031 [US5] **Verify prefs pipeline for `visualPreset` (no new modeling)**: `UserPreferences` in `packages/core`, Zod in `packages/validation/src/schemas/user-preferences.ts`, and Mongo `put`/`findByUserId` in `packages/db/src/repositories/user-preferences-repository.ts` already include `visualPreset` from Phase 2. Confirm **`GET`/`PATCH /api/me/preferences`** in `apps/api/src/routes/preferences.ts` round-trips `visualPreset` per `contracts/day-planning-rest.md` and `data-model.md`, including sensible **default** when a user has no prefs doc yet.
- [x] T032 [P] [US5] Add preset CSS variable maps (e.g. calm vs playful) in `apps/web/src/styles/presets.css` and apply root class switching in `apps/web/src/App.tsx` or `apps/web/src/main.tsx`. Preset styles MUST respect **`spec.md` US5 AS2** (body copy ≥16px, primary controls ≥44×44 CSS px).
- [x] T033 [US5] Add preset selector UI bound to preferences API in `apps/web/src/pages/RundownPage.tsx` or new `apps/web/src/pages/SettingsPage.tsx`

---

## Phase 8: User Story 6 — Plan change history (Priority: P6)

**Goal**: Append-only chronological history for meaningful mutations (FR-010, SC-007).

**Independent Test**: Perform edits; history lists events in order with task references and useful payloads.

### Implementation for User Story 6

- [x] T034 [P] [US6] Add `PlanHistoryEvent` type in `packages/core/src/models/plan-history.ts` and `PlanHistoryRepository` port in `packages/domain/src/interfaces/plan-history-repository.ts`; export from package indexes
- [x] T035 [US6] Implement `MongoPlanHistoryRepository` in `packages/db/src/repositories/plan-history-repository.ts` and export from `packages/db/src/index.ts`
- [x] T036 [US6] Record history from domain mutations in `packages/domain/src/actions/` (create/update/reorder/triage/prefs/rewards as applicable) per `specs/003-vision-aligned-rebuild/data-model.md`. **Idempotency**: one logical user action MUST NOT produce duplicate phantom history rows (supports **SC-007**); use stable correlation or single append per mutation path where retries exist.
- [x] T037 [P] [US6] Add `apps/api/src/routes/history.ts` with paginated `GET` per `specs/003-vision-aligned-rebuild/contracts/day-planning-rest.md`; wire in `apps/api/src/index.ts` and `apps/api/src/app.ts`
- [x] T038 [P] [US6] Extend `packages/api-client/src/client.ts` with history fetch API
- [x] T039 [US6] Add read-only `apps/web/src/components/PlanHistoryPanel.tsx` and integrate into the planning shell (e.g. from `apps/web/src/pages/RundownPage.tsx`)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Build health, docs, and constitution checks across slices.

**Scheduling note**: **T040** and **T041** may run **incrementally** during the milestone (fix build/test regressions as slices land). **T042** and **T048** should align with **release or sign-off** documentation so quickstart and session/offline notes match shipped behavior—avoid reading “after all stories” as “never start T040/T041 early,” or treating doc tasks as interchangeable with build/test health checks.

- [ ] T040 [P] Run `pnpm build` from repository root and fix TypeScript errors from 003 changes
- [ ] T041 [P] Run `pnpm test` from repository root (or scoped filters per package) and fix regressions introduced by 003 tasks
- [ ] T042 [P] Refresh `specs/003-vision-aligned-rebuild/quickstart.md` with final routes, env vars, and curl examples matching shipped code. Include **FR-011** cross-session checks: same authenticated user after logout/login (or new browser session) sees consistent plan, notes, ledger balance, and history as applicable.
- [ ] T048 [P] Add **Session / offline (v1)** subsection to `specs/003-vision-aligned-rebuild/quickstart.md`: server-authoritative persistence, client retry after failed mutations, refresh-after-success; state that **offline write queue** and **merge UI** are out of scope for 003 v1 (see `spec.md` Assumptions)

---

## Phase 10: NativeScript parity (US2–US6)

**Purpose**: Satisfy constitution **mobile-native fidelity** and `spec.md` **mobile / web parity** for **US2–US6** — each surface owns its UI; consume the same REST/`api-client` contracts. (**US1** mobile/web create parity is **T049–T050**; **task edit / focus / bounty** parity is **T051–T056** in the gap-closure section above.)

**⚠️ Depends on**: Corresponding API + web slices existing or in progress so contracts are stable.

**⚠️ Lifecycle parity**: **T043–T047** alone do not complete **product story-done** for **full task lifecycle** if **T051–T056** remain open—users must be able to **edit tasks**, set **in progress**, and configure **bounties** on **mobile** as well as web.

- [ ] T043 [P] [US2] Implement triage / defer / move-day flows on mobile in `apps/mobile/src/views/rundown-view.ts` and `apps/mobile/src/views/rundown-view.xml` (or add `apps/mobile/src/views/triage-view.ts` + `triage-view.xml` and register in `apps/mobile/src/app.ts`)
- [ ] T044 [P] [US3] Add actionable **notes** UX (view/edit markdown or plain text detail) in new `apps/mobile/src/views/task-detail-view.ts` + `task-detail-view.xml`, navigable from rundown — **see US3 “T044 vs T054”**; prefer one combined detail route when **T054** runs
- [ ] T045 [P] [US4] Add rewards balance + marketplace minimal flow in new `apps/mobile/src/views/rewards-view.ts` + `rewards-view.xml` and wire navigation in `apps/mobile/src/app.ts`
- [ ] T046 [P] [US5] Apply `visualPreset` from preferences API to mobile chrome (theme classes or `App_Resources` colors) in `apps/mobile/src/app.ts` with at least two presets matching web intent. Respect **constitution** platform fidelity: **iOS** ~44pt / **Android** ~48dp minimum touch targets per **`spec.md` US5 AS2`. **Depends on**: **T031** (prefs API round-trip for `visualPreset`) and **T032** (web preset CSS variable / root-class intent so mobile can mirror tokens). **T033** (web preset selector UI) is **not\*\* a hard blocker—mobile can read and apply `visualPreset` from the API without it.
- [ ] T047 [P] [US6] Add read-only plan history list in new `apps/mobile/src/views/history-view.ts` + `history-view.xml` and entry from `apps/mobile/src/app.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** → **US1 (Phase 3)** → later stories in priority order **or** parallelize **after US1** where stories do not depend on each other’s UI (server-side US4 can proceed before US3 if task shapes already support bounty fields).
- **Gap closure T049–T050**: SHOULD finish **before** treating US1 as fully shippable on `apps/web` / `apps/mobile`; **T049** and **T050** may run **in parallel** and may overlap with early **Phase 6** if staffed.
- **Gap closure T051–T056**: SHOULD finish **before** treating **US1** / **US4** as **product-complete** per **`spec.md`** definition of done; **T051** depends on **T022**/`getTask`; **T053**/**T056** extend **T049**/**T050**; **T054**–**T055** can parallelize after **T051** patterns exist.
- **Polish (Phase 9)**: **T040** / **T041** may run incrementally during the milestone; **T042** / **T048** should align with release/sign-off documentation (see Phase 9 **Scheduling note**).
- **Phase 10 (mobile parity)**: Run **after** each story’s API is available — **T043** after US2 routes, **T044** after T022–T023 patterns, **T045** after T028, **T046** after **T031** + **T032** (not blocked on **T033**), **T047** after T037. Can parallelize with web polish if staffed.

### User Story Dependencies

- **US1**: After Phase 2 — **no dependency** on other stories.
- **US2**: After US1 API/rundown baseline (needs task list + fit context).
- **US3**: After US1 (extends same task resource).
- **US4**: After US1; completion flow must run atomically with ledger (extend same PATCH/complete path used today).
- **US5**: After Phase 2; **full UX** after US2–US4 surfaces exist if presets must style those screens (T033 timing).
- **US6**: After the mutations you want audited exist (typically after US1–US2 at minimum; extend as US3–US5 land).

### Parallel Opportunities

- **Phase 2**: T002 and T003 in parallel; T004 after both.
- **US1**: T009 and T010 after **T006** (parallel with **T007**); **T008** after T005–T007; T015 parallel to T014 once API stable.
- **US4**: T024 and T025 in parallel; T029 parallel to T028 after routes exist.
- **Client gap T051–T056**: **T052**/**T055** can parallel **T053**/**T056** after **T051**/**T054** shapes exist; **T054** may follow **T051** for copy parity.
- **US6**: T034, T037, T038 parallel once port shape is agreed.

---

## Parallel Example: User Story 1

```bash
# After T006 (types extended); T007 can run in parallel with T009/T010:
# Parallel: validation schemas + Mongo task mapping (neither depends on computeDayFit)
Task: "T009 [P] [US1] Extend Zod task schemas in packages/validation/src/schemas/task.ts …"
Task: "T010 [P] [US1] Map new fields in packages/db/src/repositories/task-repository.ts …"

# After API returns extended rundown:
# Parallel: web vs mobile UI
Task: "T014 [US1] … apps/web/src/pages/RundownPage.tsx …"
Task: "T015 [P] [US1] … apps/mobile/src/views/rundown-view.ts …"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1–2.
2. Complete Phase 3 (US1) through **T014** minimum; add **T015** if mobile MVP is in scope; add **T049** and **T050** so first-party web/mobile can create actionables (US1 independent test).
3. **STOP and VALIDATE** against US1 **Independent Test** in `specs/003-vision-aligned-rebuild/spec.md`.
4. **Scope honesty**: MVP US1 does **not** yet satisfy **FR-004** fully (skip + reward-ledger coupling) nor **FR-009** on mobile until **Phase 10** tasks for later stories are done.

### Incremental Delivery

1. Ship **US1** (flexible runway + fit).
2. Add **US2** (triage) → validate independently.
3. Add **US3** (notes) → validate.
4. Add **US4** (rewards/marketplace) → validate.
5. Add **US5** (presets) → validate across entry points.
6. Add **US6** (history) → validate ordering and payload clarity.

### Parallel Team Strategy

- Developer A: US1 domain + API (`packages/domain`, `apps/api`).
- Developer B: US1 web UI (`apps/web`).
- Developer C: US1 mobile (`apps/mobile`) once API contracts stable.

---

## Notes

- Prefer **additive** REST and Mongo fields per `specs/003-vision-aligned-rebuild/research.md` §11.
- Keep **domain** free of Hono/Mongo imports; use ports in `packages/domain/src/interfaces/`.
- **FR-011** (persistence) is satisfied incrementally as each slice persists its new fields through the session-backed API. **Explicit verification**: **T042** (quickstart checklist), **T048** (session/offline v1 boundary), and **T041** (regressions)—see **`spec.md` FR-011**.
- **T048** can run as soon as quickstart exists — document recovery boundary early to avoid scope creep on “offline.”
