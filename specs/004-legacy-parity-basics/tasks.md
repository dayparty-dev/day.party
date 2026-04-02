# Tasks: First-party parity with legacy baseline capabilities

**Input**: Design documents from `/specs/004-legacy-parity-basics/`  
**Prerequisites**: [`plan.md`](./plan.md), [`spec.md`](./spec.md), [`research.md`](./research.md), [`data-model.md`](./data-model.md), [`contracts/legacy-parity-rest.md`](./contracts/legacy-parity-rest.md), [`quickstart.md`](./quickstart.md)

**Tests**: **Not included** — spec does not mandate TDD; follow [`plan.md`](./plan.md) pragmatic quality and [`quickstart.md`](./quickstart.md) for manual verification.

**Organization**: Phases follow [`spec.md`](./spec.md) user-story priorities (P1–P5). Implementation is **spec- and contract-driven**; `apps/web-legacy/` is **not** a source of truth ([`/.specify/memory/constitution.md`](../../.specify/memory/constitution.md)).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks in the same wave)
- **[Story]**: `[US1]`…`[US10]` on user-story phase tasks only
- Paths are repo-relative from monorepo root

### Product vs web-only (004)

| Area                                                                            | Web            | Mobile           | Notes                                 |
| ------------------------------------------------------------------------------- | -------------- | ---------------- | ------------------------------------- |
| Operator, feedback **triage**                                                   | Required       | **Not required** | [`spec.md`](./spec.md) clarifications |
| Compact focus (PiP)                                                             | Optional (US5) | Out of scope     | FR-006                                |
| Core planner parity (date, reorder, focus, tags, feedback submit, locale/theme) | Required       | Required         | FR-002–FR-005, FR-007, FR-009–FR-011  |

---

## Phase 1: Setup (shared infrastructure)

**Purpose**: Traceability and repo readiness for 004.

- [x] T001 [P] Add a **Related artifacts** subsection near the top of `specs/004-legacy-parity-basics/spec.md` linking [`plan.md`](./plan.md), [`tasks.md`](./tasks.md), [`data-model.md`](./data-model.md), [`contracts/legacy-parity-rest.md`](./contracts/legacy-parity-rest.md), and [`quickstart.md`](./quickstart.md)

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Extended **user preferences** (`locale`, `colorScheme`) and **admin middleware** so US8 and all `/api/admin/*` work can proceed without rework.

**⚠️ CRITICAL**: Complete before stories that PATCH preferences (US8) or call admin APIs (US7, US9 triage).

- [x] T002 [P] Extend `UserPreferences` with `locale` (`en`|`es`) and `colorScheme` (`system`|`light`|`dark`) plus defaults in `packages/core/src/models/user-preferences.ts`; export from `packages/core/src/index.ts` per `specs/004-legacy-parity-basics/data-model.md`
- [x] T003 [P] Extend `patchUserPreferencesSchema` and related types in `packages/validation/src/schemas/user-preferences.ts` per `specs/004-legacy-parity-basics/contracts/legacy-parity-rest.md`
- [x] T004 Update merge/default logic in `packages/domain/src/actions/user-preferences-actions.ts` for `locale` and `colorScheme`
- [x] T005 Update document read/write mapping in `packages/db/src/repositories/user-preferences-repository.ts` (omit new fields until patched — backward compatible)
- [x] T006 Ensure `GET`/`PATCH` user preferences routes in `apps/api/src/routes/preferences.ts` accept and return new fields with existing auth patterns
- [x] T007 Extend `DayPartyClient` preference types and JSON parsers in `packages/api-client/src/client.ts` for `locale` and `colorScheme`
- [x] T008 [P] Add `requireAdmin` middleware (403 when `user.role !== 'admin'`) in `apps/api/src/middleware/admin-middleware.ts`
- [x] T009 Export helper from `apps/api/src/middleware/admin-middleware.ts` and document usage beside `createAuthMiddleware` in `apps/api/src/types.ts` / route modules

**Checkpoint**: Preferences and admin gate are ready — **US1** can start in parallel with **US2–US4** (they do not block landing); **US8** should wait for Phase 2.

---

## Phase 3: User Story 1 — Public entry (Priority: P1) 🎯 MVP slice

**Goal**: Logged-out visitors see product positioning and a path to sign-in (FR-001).

**Independent Test**: Open `/` logged out → landing copy + CTA → login route works.

### Implementation for User Story 1

- [x] T010 [P] [US1] Create `apps/web/src/pages/LandingPage.tsx` with concise value proposition and primary CTA linking to `/login`
- [x] T011 [US1] Update `apps/web/src/App.tsx` routes: unauthenticated `/` renders `LandingPage`; authenticated `/` redirects to `/rundown` (preserve existing protected routes)

**Checkpoint**: MVP marketing entry on web — **no mobile requirement** for US1.

---

## Phase 4: User Story 2 — Multi-day planning (Priority: P1)

**Goal**: Select arbitrary `YYYY-MM-DD` for rundown (and related flows) on **web and mobile** (FR-002).

**Independent Test**: Pick non-today date → rundown matches; return to today; invalid date handled.

### Implementation for User Story 2

- [x] T012 [P] [US2] Add selected-date state synced to URL query (e.g. `?date=`) and day-navigation UI in `apps/web/src/pages/RundownPage.tsx`
- [x] T013 [US2] Thread selected date into `client.getRundown`, capacity hints, create-task default `scheduledDate`, and triage targets in `apps/web/src/pages/RundownPage.tsx`, `apps/web/src/components/CreateTaskPanel.tsx`, and `apps/web/src/components/TaskEditPanel.tsx` as needed
- [x] T014 [P] [US2] Add date picker / stepper and load `getRundown(selectedDate)` in `apps/mobile/src/views/rundown-view.ts` and `apps/mobile/src/views/rundown-view.xml`

**Checkpoint**: Multi-day planning works on both clients.

---

## Phase 5: User Story 3 — Reorder runway (Priority: P2)

**Goal**: Direct-manipulation reorder with accessible alternative; persist via existing reorder API (FR-003, FR-004).

**Independent Test**: Reorder on web (drag + keyboard path) and mobile; refresh → order holds.

### Implementation for User Story 3

- [x] T015 [P] [US3] Implement drag-and-drop (e.g. `@dnd-kit`) calling `client.reorderTasks` in `apps/web/src/components/RunwayTaskList.tsx` (or equivalent) and integrate into `apps/web/src/pages/RundownPage.tsx`
- [x] T016 [US3] Add keyboard-accessible reorder (focus + move up/down) in `apps/web/src/components/RunwayTaskList.tsx` matching the same API calls as T015
- [x] T017 [P] [US3] Add mobile reorder (buttons or gesture) invoking `reorderTasks` in `apps/mobile/src/views/rundown-view.ts`

**Checkpoint**: US3 complete on web + mobile.

---

## Phase 6: User Story 4 — Focus session depth (Priority: P2)

**Goal**: Adjust intended effort during focus; show **next** item after complete (FR-005).

**Independent Test**: Change estimate on ongoing screen; complete → next task or empty state.

### Implementation for User Story 4

- [ ] T018 [US4] Add in-flow edit for `estimatedMinutes` (and/or size) with `client.updateTask` in `apps/web/src/pages/OngoingPage.tsx`
- [ ] T019 [US4] Render **next** open task preview (title + meta) after **completion** or below current card in `apps/web/src/pages/OngoingPage.tsx`; when the user **skips** / **pauses** focus per product rules, update the preview so **what is next** (or end-of-day) stays obvious per `spec.md` US4 scenario 3
- [ ] T020 [P] [US4] Mirror T018–T019 (including **skip/next** behavior) in `apps/mobile/src/views/ongoing-view.ts` and `apps/mobile/src/views/ongoing-view.xml`

**Checkpoint**: US4 complete on web + mobile.

---

## Phase 7: User Story 5 — Compact focus surface (Priority: P3)

**Goal**: Optional Document PiP mini-window on supported desktop browsers (FR-006).

**Independent Test**: On supported Chrome/Edge, open PiP, toggle focus/complete; main tab stays consistent; unsupported → control hidden.

### Implementation for User Story 5

- [ ] T021 [US5] Add feature-detected Document PiP shell + primary actions in `apps/web/src/components/FocusPiP.tsx` and entry control in `apps/web/src/pages/OngoingPage.tsx` (share state via existing client reload pattern)

**Checkpoint**: US5 web-only; may ship after US4.

---

## Phase 8: User Story 6 — Tag catalog management (Priority: P3)

**Goal**: Full tag CRUD in UI; **delete with policy** (clear default, optional reassignment) per clarifications (FR-007).

**Independent Test**: Create tag; assign; delete with references — confirm dialog; optional reassignment path.

### Implementation for User Story 6

- [ ] T022 [P] [US6] Implement `deleteTagWithPolicy` domain action in `packages/domain/src/actions/delete-tag-with-policy.ts` (strip `tagKey` / `bounty.tagKeys` or reassign, then delete tag) and export from `packages/domain/src/index.ts` — this satisfies **FR-007** “merge/consolidate” semantics for **004 v1** (reassign-on-delete; no separate merge-two-tags wizard)
- [ ] T023 [US6] Add repository helpers or queries needed for bulk task updates in `packages/db/src/repositories/task-repository.ts` and wire action to `packages/db` from `apps/api/src/index.ts`
- [ ] T024 [US6] Add `POST /api/tags/:id/delete-with-policy` with Zod body in `apps/api/src/routes/tags.ts` per `contracts/legacy-parity-rest.md`
- [ ] T025 [US6] Add `deleteTagWithPolicy` (or named) method to `packages/api-client/src/client.ts`
- [ ] T026 [P] [US6] Build tag manager UI (list/create/edit color/delete flow with confirmation) in `apps/web/src/components/TagManagerPanel.tsx` and surface from `apps/web/src/pages/RundownPage.tsx` or new settings route
- [ ] T027 [P] [US6] Add tag management + delete confirmation UX in `apps/mobile/src/views/rundown-view.ts` or `apps/mobile/src/views/tag-settings-view.ts` + XML

**Checkpoint**: US6 complete on web + mobile.

---

## Phase 9: User Story 7 — Operator tools (Priority: P3)

**Goal**: Web-only admin routes + UI: user search, task inspect/patch, **audit** writes; **no impersonation** (FR-008).

**Independent Test**: Normal user → 403 on `/admin` and admin APIs; admin → search + patch with confirm + audit row.

### Implementation for User Story 7

- [ ] T028 [P] [US7] Add `AdminAuditEvent` (or equivalent) type in `packages/core/src/models/admin-audit.ts`, Zod schemas in `packages/validation/src/schemas/admin-audit.ts`, and `MongoAdminAuditRepository` in `packages/db/src/repositories/admin-audit-repository.ts`; export from package indexes
- [ ] T029 [US7] Register audit repo in `apps/api/src/index.ts` and `apps/api/src/types.ts`; add helper to append audit rows from `apps/api/src/routes/admin/audit-helper.ts` (thin wrapper)
- [ ] T030 [US7] Implement `GET /api/admin/users` (q=) and `GET /api/admin/users/:id` in `apps/api/src/routes/admin/users.ts` with `requireAdmin`
- [ ] T031 [US7] Implement `GET /api/admin/tasks` and `PATCH /api/admin/tasks/:id` in `apps/api/src/routes/admin/tasks.ts` with `requireAdmin` and audit on destructive/sensitive patches; implement `GET /api/admin/audit` (cursor pagination) in `apps/api/src/routes/admin/audit.ts` per `specs/004-legacy-parity-basics/contracts/legacy-parity-rest.md`
- [ ] T032 [US7] Mount admin route subtree from `apps/api/src/app.ts` under `/api/admin` with shared auth + admin middleware (**users**, **tasks**, **audit** from T031); mount **admin feedback** when `T046` is implemented
- [ ] T033 [P] [US7] Add admin API methods to `packages/api-client/src/client.ts` (`listUsersAdmin`, `getUserAdmin`, `listTasksAdmin`, `patchTaskAdmin`, `listAdminAudit`, etc.)
- [ ] T034 [P] [US7] Create `apps/web/src/pages/admin/AdminHomePage.tsx` (user search + links) and `apps/web/src/pages/admin/AdminUserDetailPage.tsx` or combined flow with task table; add `apps/web/src/pages/admin/AdminAuditPage.tsx` that loads recent rows via `client.listAdminAudit` (actor, action summary, target, timestamp) with simple pagination or “load more”; add an **Audit log** link from `AdminHomePage` to `/admin/audit`
- [ ] T035 [US7] Register nested `/admin/*` routes in `apps/web/src/App.tsx` (e.g. `AdminLayout` with `<Outlet />`): `/admin` → home, `/admin/audit` → `AdminAuditPage`; add `/admin/feedback` when **T050** lands. Guard the whole `/admin` tree: non-admins → redirect `/rundown` using `user.role === 'admin'` from `apps/web/src/context/auth-context.tsx`

**Checkpoint**: Operator slice web-only; mobile unchanged.

---

## Phase 10: User Story 8 — Locale + global appearance (Priority: P4)

**Goal**: `en`/`es` for core strings; **system**/**light**/**dark** persisted and distinct from `visualPreset` (FR-009, FR-010).

**Independent Test**: Switch locale → strings update; match system follows OS; explicit override pins until match system.

### Implementation for User Story 8

- [ ] T036 [P] [US8] Add `react-i18next` + `i18next` deps in `apps/web/package.json`; add `apps/web/src/i18n/index.ts`, `apps/web/src/i18n/en.json`, `apps/web/src/i18n/es.json`; initialize in `apps/web/src/main.tsx`
- [ ] T037 [US8] Replace user-visible strings with `t()` keys for **SC-005 sweep**: `apps/web/src/pages/LandingPage.tsx`, `LoginPage.tsx`, `LogoutPage.tsx`, `RundownPage.tsx`, `OngoingPage.tsx`, `RewardsPage.tsx`, `SettingsPage.tsx`, plus primary copy in `apps/web/src/components/CreateTaskPanel.tsx`, `TaskEditPanel.tsx`, `TaskTriageBar.tsx`, `TaskNotesPanel.tsx`, `PlanHistoryPanel.tsx`, `FeedbackForm.tsx` (when added), and admin pages under `apps/web/src/pages/admin/`
- [ ] T038 [P] [US8] Implement global color scheme: `prefers-color-scheme` when `colorScheme===system`, else `data-color-scheme` on `document.documentElement`, synced from prefs in `apps/web/src/context/theme-context.tsx` (new) or extended preset context; update `apps/web/src/index.css` tokens
- [ ] T039 [P] [US8] Add settings UI (locale + appearance + visual preset) persisting via `patchUserPreferences` in `apps/web/src/pages/SettingsPage.tsx` and link from `apps/web/src/pages/RundownPage.tsx` header or profile menu
- [ ] T040 [P] [US8] Add mobile i18n JSON + small loader in `apps/mobile/src/services/i18n.ts` and apply to `apps/mobile/src/views/rundown-view.ts`, `ongoing-view.ts`, and auth views
- [ ] T041 [P] [US8] Sync `locale`/`colorScheme` from API preferences + OS theme hooks in `apps/mobile/src/app.ts` or root `Frame` styling

**Checkpoint**: US8 across web + mobile (constitution: platform-specific UI, shared prefs contract).

---

## Phase 11: User Story 9 — Feedback + lightweight notifications (Priority: P4)

**Goal**: Persist feedback in Mongo; admin list on **web**; toasts for success paths (FR-011).

**Independent Test**: Submit feedback → confirmation toast; admin sees row; failure keeps draft message.

### Implementation for User Story 9

- [ ] T042 [P] [US9] Add feedback document shape types in `packages/core/src/models/feedback.ts`, `createFeedbackSchema` in `packages/validation/src/schemas/feedback.ts`, and `MongoFeedbackRepository` in `packages/db/src/repositories/feedback-repository.ts`; export indexes
- [ ] T043 [US9] Register `feedbackRepo` in `apps/api/src/index.ts` and `apps/api/src/types.ts`
- [ ] T044 [US9] Implement `makeSubmitFeedbackAction` in `packages/domain/src/actions/feedback-actions.ts` and `POST /api/feedback` in `apps/api/src/routes/feedback.ts`; mount in `apps/api/src/app.ts`
- [ ] T045 [US9] Add `submitFeedback` and admin list method to `packages/api-client/src/client.ts`
- [ ] T046 [P] [US9] Implement `GET /api/admin/feedback` with cursor/limit in `apps/api/src/routes/admin/feedback.ts` using `requireAdmin`
- [ ] T047 [P] [US9] Add `sonner` (or chosen) toaster root in `apps/web/src/main.tsx` / `App.tsx` and `apps/web/src/components/FeedbackForm.tsx` with submit wired to `client.submitFeedback`
- [ ] T048 [P] [US9] Fire **non-blocking** toasts on **successful** saves (window, triage, notes, etc.) and on **failed** mutations (network/validation) in `apps/web/src/pages/RundownPage.tsx`, `apps/web/src/pages/OngoingPage.tsx`, and `apps/web/src/components/FeedbackForm.tsx` — same pattern: brief message, no focus trap (FR-011)
- [ ] T049 [P] [US9] Add feedback submission UI (modal or page) in `apps/mobile/src/views/rundown-view.ts` calling new client method
- [ ] T050 [US9] Build `apps/web/src/pages/admin/AdminFeedbackPage.tsx` listing submissions; link from `apps/web/src/pages/admin/AdminHomePage.tsx`

**Checkpoint**: US9 end-to-end; triage web-only.

---

## Phase 12: User Story 10 — Keyboard shortcuts (Priority: P5)

**Goal**: Documented desktop shortcuts for common navigation (FR-012).

**Independent Test**: Help page lists shortcuts; two shortcuts work without breaking typing in inputs.

### Implementation for User Story 10

- [ ] T051 [P] [US10] Add `react-hotkeys-hook` (or equivalent) in `apps/web/package.json` and implement `apps/web/src/hooks/useAppHotkeys.ts` bound in `apps/web/src/App.tsx` (modifier keys, ignore when typing in inputs)
- [ ] T052 [US10] Add `apps/web/src/pages/HelpShortcutsPage.tsx` (or settings section) documenting shortcuts; add route + link from header in `apps/web/src/App.tsx` or `RundownPage.tsx`

**Checkpoint**: US10 web-only.

---

## Phase 13: Polish & cross-cutting

**Purpose**: Manual QA and docs consistency.

- [ ] T053 [P] Walk through `specs/004-legacy-parity-basics/quickstart.md` on web + mobile including **SC-004** (`curl` 403 + audit list) and **SC-005** locale sweep checklist; file issues or fix gaps in the same feature branch
- [ ] T054 [P] Align `specs/004-legacy-parity-basics/contracts/legacy-parity-rest.md` with implemented paths and bodies if drift appears during implementation

---

## Dependencies & execution order

### Phase dependencies

- **Phase 1**: Start anytime.
- **Phase 2**: Blocks **US8** and **US7/US9** server admin/feedback routes; **US1–US6** can start after Phase 1 (US2–US6 use existing APIs). **Recommended**: finish Phase 2 before **US8** and before **Phase 9–11** admin/feedback backend.
- **US1**: Independent after Phase 1.
- **US2–US4**: Independent of each other after Phase 1; all touch planner/focus — serialize if same files conflict.
- **US5**: Depends on **US4** (ongoing page structure).
- **US6**: Independent of US7–10 except shared tag routes file `apps/api/src/routes/tags.ts` — coordinate merges.
- **US7**: Phase 2 + T028–T032 before admin UI **T034–T035**; **T033** can parallel API once routes exist.
- **US8**: **Requires Phase 2** for persisted prefs.
- **US9**: **T042–T044** before **T047–T050**; **T046** after Phase 2 admin middleware.
- **US10**: Last web UX polish; independent.

### User story dependency summary

| Story | Depends on                           |
| ----- | ------------------------------------ |
| US1   | Phase 1                              |
| US2   | Phase 1 (API already has `date`)     |
| US3   | Phase 1                              |
| US4   | Phase 1                              |
| US5   | US4 ongoing UI                       |
| US6   | Phase 1                              |
| US7   | Phase 2                              |
| US8   | Phase 2                              |
| US9   | Phase 2 (admin list + feedback POST) |
| US10  | US1–US4 routes stable (soft)         |

### Parallel opportunities

- **T002** + **T003** + **T008** (Phase 2) different packages/files.
- **T010** + **T012** + **T015** + **T018** + **T022** + **T036** + **T042** + **T051** — different areas once their prerequisites met; **serialize or single-owner** edits to `apps/web/src/App.tsx` and `apps/web/package.json` to avoid lost merges.

---

## Parallel example: Phase 2

```bash
# After T001, launch in parallel:
T002 packages/core UserPreferences extension
T003 packages/validation user-preferences schema
T008 apps/api admin middleware file (stub 403)
```

---

## Parallel example: User Story 2 + 3 + 6 (API-heavy)

```bash
T014 mobile rundown date          # mobile files
T015 web reorder component        # web files
T022 domain delete-tag-with-policy # packages/domain
```

---

## Implementation strategy

### MVP first

1. Phase 1 + **US1** (T001, T010–T011) → public landing.
2. Add **Phase 2** + **US2** → multi-day + prefs foundation for later.

### Incremental delivery

1. **P1**: US1 + US2 (and Phase 2 if including prefs early).
2. **P2**: US3 + US4.
3. **P3**: US5 (optional) + US6 + US7.
4. **P4**: US8 + US9.
5. **P5**: US10 + Polish.

### Suggested MVP scope

- **Minimal**: **US1** only (landing) — does not satisfy full FR-002; good for marketing smoke.
- **Core parity start**: **US1 + US2 + Phase 2** — planning date + prefs ready for US8.

---

## Notes

- **Reorder** already exists server-side — do not reimplement ordering logic in clients beyond calling `reorderTasks`.
- **Operator**: never mint end-user session tokens (clarification).
- Commit after each task or logical group; use gitmoji scopes from repo guidelines.
