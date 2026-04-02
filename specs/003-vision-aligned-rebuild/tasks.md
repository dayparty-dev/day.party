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

Per `spec.md` (**Mobile / web parity**), a user story is **product-done** only when **both** `apps/web` and `apps/mobile` ship that story’s UX. For **US2** and **US3**, phases below mark **web + API** work complete (**T016–T023**, **T020**, **T023**); **mobile parity** is **T043** / **T044** (Phase 10). Until those are `[x]`, treat US2/US3 as **web slice complete**, not fully story-closed on the product.

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
- [x] T014 [US1] Implement day window controls, fit/overflow, and **runway vs outside-runway labeling** (and priority badges) in `apps/web/src/pages/RundownPage.tsx` and `apps/web/src/components/TaskCard.tsx` — **no triage actions** here (defer/demote → US2 / `TriagePanel.tsx`)
- [x] T015 [P] [US1] Surface extended rundown and day-window feedback in `apps/mobile/src/views/rundown-view.ts` (and `apps/mobile/src/views/rundown-view.xml` as needed)

**Checkpoint**: MVP day planning + fit feedback on web and mobile **after T049–T050** — **stop here** for demo if desired (US1 product story-done still requires create UX on both clients per `spec.md`).

---

## Phase 4: User Story 2 — Triage overflow and move work (Priority: P2)

**Goal**: Defer, demote, or move items; suggested placement; overflow UX paths (FR-005, SC-003).

**Product story-done**: **US2** on the product also requires **T043** (mobile triage). The tasks below are **web + API slice** complete.

**Independent Test**: Mark incomplete or overflowing items for tomorrow / another date / low importance; verify task dates and statuses update via API and appear correctly in rundown.

### Implementation for User Story 2

- [x] T016 [US2] Add `status` / `deferredToDate` (and related enums) to `Task` in `packages/core/src/models/task.ts` per `specs/003-vision-aligned-rebuild/data-model.md`
- [x] T017 [US2] Implement triage transitions in `packages/domain/src/actions/update-task.ts` (or new `packages/domain/src/actions/triage-task.ts`) with validation rules consistent with spec acceptance scenarios
- [x] T018 [P] [US2] Extend `apps/api/src/routes/tasks.ts` (or add `apps/api/src/routes/triage.ts`) for triage payloads per `specs/003-vision-aligned-rebuild/contracts/day-planning-rest.md`
- [x] T019 [P] [US2] Add optional capacity suggestion helper and `GET` query route in `apps/api/src/routes/tasks.ts` implementing the heuristic in `specs/003-vision-aligned-rebuild/research.md` §5 (**remaining minutes vs planned load per day** only; **no unavailable/busy-period blocking** in v1 — see `spec.md` US2 and `contracts/day-planning-rest.md`)
- [x] T020 [US2] Build triage / overflow flows in `apps/web/src/pages/RundownPage.tsx` or new `apps/web/src/components/TriagePanel.tsx`

---

## Phase 5: User Story 3 — Richer notes on actionables (Priority: P3)

**Goal**: Persist markdown notes on tasks; scannable list + detail view (FR-006, SC-004).

**Product story-done**: **US3** on the product also requires **T044** (mobile notes). The tasks below are **web + API slice** complete.

**Independent Test**: Add long markdown to a task, reload, confirm formatting preserved and list rows stay compact.

### Implementation for User Story 3

- [x] T021 [P] [US3] Add `notesMarkdown` to `Task` in `packages/core/src/models/task.ts`, validation in `packages/validation/src/schemas/task.ts`, and BSON mapping in `packages/db/src/repositories/task-repository.ts`; ensure rundown serialization **omits** `notesMarkdown` (see `contracts/day-planning-rest.md` P3)
- [x] T022 [US3] Add `GET /api/tasks/:id` in `apps/api/src/routes/tasks.ts` returning **full** task including `notesMarkdown`; ensure **route order** registers `GET /`, `PATCH /reorder`, etc. **before** `GET /:id` per `contracts/day-planning-rest.md`. Rundown **`GET /api/tasks?date=`** MUST omit `notesMarkdown` (optional `notesPreview` only per contract)
- [x] T023 [US3] Add notes editor/detail UI in new `apps/web/src/components/TaskNotesPanel.tsx` (or similar) and integrate from `apps/web/src/pages/RundownPage.tsx` with lightweight markdown rendering

---

## Gap closure: Create actionable (web + mobile)

**Purpose**: US1 is incomplete on greenfield clients until users can add tasks without `apps/web-legacy` or raw HTTP. **Depends on**: T011/T013 (API + `DayPartyClient.createTask` already shipped).

- [ ] T049 [P] [US1] Implement create-task UX in `apps/web` (new component under `apps/web/src/components/` and/or `apps/web/src/pages/RundownPage.tsx`), calling `DayPartyClient.createTask` with **`scheduledDate`** aligned to the current rundown date and fields allowed by `createTaskSchema` (`estimatedMinutes` and/or legacy `size`, title, etc.); on success, **refetch rundown** or merge the created task per existing data-loading patterns
- [ ] T050 [P] [US1] Implement create-task UX in `apps/mobile` (`apps/mobile/src/views/rundown-view.ts` + `rundown-view.xml`, or a small dedicated view + `app.ts` registration), same API contract as T049; register navigation if split into a separate view

---

## Phase 6: User Story 4 — Rewards, bounties, marketplace (Priority: P4)

**Goal**: Bounty on completion, ledger balance, catalog purchase flow (FR-004, FR-007, FR-008, SC-005).

**Independent Test**: Complete a bounty task → balance increases → purchase reward → ledger reflects debit.

### Implementation for User Story 4

- [ ] T024 [P] [US4] Add `RewardDefinition` and `LedgerEntry` types in `packages/core/src/models/reward.ts` and `packages/core/src/models/ledger.ts` (or single module) and export from `packages/core/src/index.ts`
- [ ] T025 [P] [US4] Add `RewardDefinitionRepository` and `LedgerRepository` ports in `packages/domain/src/interfaces/` and export from `packages/domain/src/index.ts`
- [ ] T026 [US4] Implement `MongoRewardDefinitionRepository` and `MongoLedgerRepository` in `packages/db/src/repositories/`; export from `packages/db/src/index.ts`
- [ ] T027 [US4] Add domain actions for granting bounty on completion and purchasing rewards in `packages/domain/src/actions/complete-task-with-rewards.ts` (or extend existing completion flow) and `packages/domain/src/actions/purchase-reward.ts` (**FR-004** completion path consistent with **FR-007/FR-008** ledger rules)
- [ ] T028 [US4] Add `apps/api/src/routes/rewards.ts` and `apps/api/src/routes/ledger.ts` (or combined router) per `specs/003-vision-aligned-rebuild/contracts/day-planning-rest.md`; wire repos/actions in `apps/api/src/index.ts` and mount in `apps/api/src/app.ts`
- [ ] T029 [P] [US4] Extend `packages/api-client/src/client.ts` for rewards, ledger, and task bounty fields
- [ ] T030 [US4] Add minimal marketplace and balance UI in new `apps/web/src/pages/RewardsPage.tsx` and route from `apps/web/src/App.tsx`

---

## Phase 7: User Story 5 — Visual presets (Priority: P5)

**Goal**: At least two UI presets across core screens; persisted preference (FR-009, SC-006).

**Independent Test**: Switch preset; planning + triage + rewards entry points pick up tokens without unreadable text.

### Implementation for User Story 5

- [ ] T031 [US5] Ensure `visualPreset` is on `UserPreferences` in `packages/core/src/models/user-preferences.ts`, validated in `packages/validation/src/schemas/user-preferences.ts`, and persisted via `MongoUserPreferencesRepository` in `packages/db/src/repositories/user-preferences-repository.ts`
- [ ] T032 [P] [US5] Add preset CSS variable maps (e.g. calm vs playful) in `apps/web/src/styles/presets.css` and apply root class switching in `apps/web/src/App.tsx` or `apps/web/src/main.tsx`
- [ ] T033 [US5] Add preset selector UI bound to preferences API in `apps/web/src/pages/RundownPage.tsx` or new `apps/web/src/pages/SettingsPage.tsx`

---

## Phase 8: User Story 6 — Plan change history (Priority: P6)

**Goal**: Append-only chronological history for meaningful mutations (FR-010, SC-007).

**Independent Test**: Perform edits; history lists events in order with task references and useful payloads.

### Implementation for User Story 6

- [ ] T034 [P] [US6] Add `PlanHistoryEvent` type in `packages/core/src/models/plan-history.ts` and `PlanHistoryRepository` port in `packages/domain/src/interfaces/plan-history-repository.ts`; export from package indexes
- [ ] T035 [US6] Implement `MongoPlanHistoryRepository` in `packages/db/src/repositories/plan-history-repository.ts` and export from `packages/db/src/index.ts`
- [ ] T036 [US6] Record history from domain mutations in `packages/domain/src/actions/` (create/update/reorder/triage/prefs/rewards as applicable) per `specs/003-vision-aligned-rebuild/data-model.md`
- [ ] T037 [P] [US6] Add `apps/api/src/routes/history.ts` with paginated `GET` per `specs/003-vision-aligned-rebuild/contracts/day-planning-rest.md`; wire in `apps/api/src/index.ts` and `apps/api/src/app.ts`
- [ ] T038 [P] [US6] Extend `packages/api-client/src/client.ts` with history fetch API
- [ ] T039 [US6] Add read-only `apps/web/src/components/PlanHistoryPanel.tsx` and integrate into the planning shell (e.g. from `apps/web/src/pages/RundownPage.tsx`)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Build health, docs, and constitution checks across slices.

- [ ] T040 [P] Run `pnpm build` from repository root and fix TypeScript errors from 003 changes
- [ ] T041 [P] Run `pnpm test` from repository root (or scoped filters per package) and fix regressions introduced by 003 tasks
- [ ] T042 [P] Refresh `specs/003-vision-aligned-rebuild/quickstart.md` with final routes, env vars, and curl examples matching shipped code
- [ ] T048 [P] Add **Session / offline (v1)** subsection to `specs/003-vision-aligned-rebuild/quickstart.md`: server-authoritative persistence, client retry after failed mutations, refresh-after-success; state that **offline write queue** and **merge UI** are out of scope for 003 v1 (see `spec.md` Assumptions)

---

## Phase 10: NativeScript parity (US2–US6)

**Purpose**: Satisfy constitution **mobile-native fidelity** and `spec.md` **mobile / web parity** for **US2–US6** — each surface owns its UI; consume the same REST/`api-client` contracts. (**US1** mobile/web create parity is **T049–T050** in the gap-closure section above, not Phase 10.)

**⚠️ Depends on**: Corresponding API + web slices existing or in progress so contracts are stable.

- [ ] T043 [P] [US2] Implement triage / defer / move-day flows on mobile in `apps/mobile/src/views/rundown-view.ts` and `apps/mobile/src/views/rundown-view.xml` (or add `apps/mobile/src/views/triage-view.ts` + `triage-view.xml` and register in `apps/mobile/src/app.ts`)
- [ ] T044 [P] [US3] Add actionable notes UX (view/edit markdown or plain text detail) in new `apps/mobile/src/views/task-detail-view.ts` + `task-detail-view.xml`, navigable from rundown
- [ ] T045 [P] [US4] Add rewards balance + marketplace minimal flow in new `apps/mobile/src/views/rewards-view.ts` + `rewards-view.xml` and wire navigation in `apps/mobile/src/app.ts`
- [ ] T046 [P] [US5] Apply `visualPreset` from preferences API to mobile chrome (theme classes or `App_Resources` colors) in `apps/mobile/src/app.ts` with at least two presets matching web intent
- [ ] T047 [P] [US6] Add read-only plan history list in new `apps/mobile/src/views/history-view.ts` + `history-view.xml` and entry from `apps/mobile/src/app.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** → **US1 (Phase 3)** → later stories in priority order **or** parallelize **after US1** where stories do not depend on each other’s UI (server-side US4 can proceed before US3 if task shapes already support bounty fields).
- **Gap closure T049–T050**: SHOULD finish **before** treating US1 as fully shippable on `apps/web` / `apps/mobile`; **T049** and **T050** may run **in parallel** and may overlap with early **Phase 6** if staffed.
- **Polish (Phase 9)**: After all target user stories for the milestone are complete.
- **Phase 10 (mobile parity)**: Run **after** each story’s API is available — **T043** after US2 routes, **T044** after T022–T023 patterns, **T045** after T028, **T046** after T031–T032, **T047** after T037. Can parallelize with web polish if staffed.

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
- **FR-011** (persistence) is satisfied incrementally as each slice persists its new fields; no separate task if each story writes through existing session-backed API.
- **T048** can run as soon as quickstart exists — document recovery boundary early to avoid scope creep on “offline.”
