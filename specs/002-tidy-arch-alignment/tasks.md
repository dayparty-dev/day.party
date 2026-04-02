# Tasks: Tidy architecture alignment

**Input**: Design documents from `/specs/002-tidy-arch-alignment/`
**Prerequisites**: [`plan.md`](./plan.md), [`spec.md`](./spec.md), [`research.md`](./research.md), [`data-model.md`](./data-model.md), [`contracts/`](./contracts/)

**Tests**: **Included** for User Story 2 — [`spec.md`](./spec.md) SC-003 (v1: `create-task` + `get-rundown` core tests); [`plan.md`](./plan.md) / [`research.md`](./research.md) define domain vs adapter test taxonomy (FR-007).

**Scope**: V1 **domain slices** are defined in [`spec.md`](./spec.md) (Assumptions → Domain slices (v1)): task aggregate + shared `ApiEnv` typing; tags/auth core tests deferred until explicitly scoped.

**Organization**: Tasks are grouped by user story so each increment can ship independently (FR-006).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label ([US1], [US2], [US3]) on story-phase tasks only
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Wire feature artifacts into the repo’s entrypoints so maintainers can find the mapping and task list.

- [x] T001 [P] Add a short **Related artifacts** line at the top of `specs/002-tidy-arch-alignment/spec.md` (after **Status** or **Input**) linking to [`plan.md`](./plan.md), [`tasks.md`](./tasks.md), and [`contracts/architecture-checklist.md`](./contracts/architecture-checklist.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm checklist and spec stay aligned before **US2+ code** tasks.

**⚠️ CRITICAL**: Complete **before T005** (first `ApiEnv` / domain test code). **Phase 3 (US1)** docs may run after **Phase 1** without waiting on T002.

- [x] T002 Audit `specs/002-tidy-arch-alignment/contracts/architecture-checklist.md` rows C1–C5 against FR-002–FR-005 and SC-003 in `specs/002-tidy-arch-alignment/spec.md`; edit `specs/002-tidy-arch-alignment/contracts/architecture-checklist.md` only if requirement IDs or pass criteria drift. Spot-check **FR-005**: confirm task/tag/auth routes under `apps/api/src/routes/` still parse bodies with `@dayparty/validation` schemas at the edge (no new raw-body domain logic).

**Checkpoint**: Checklist trusted for SC-002 reviews — **US2** implementation (T005+) may begin.

---

## Phase 3: User Story 1 — Clear boundaries for product logic (Priority: P1) 🎯 MVP

**Goal**: Maintainers have an authoritative, discoverable mapping from Tidy/reference concepts to this monorepo (FR-001, SC-001).

**Independent Test**: A new contributor can open the mapping from repo-standard agent docs and answer “where do HTTP adapters vs domain actions live?” without reading Mongo or Hono internals.

### Implementation for User Story 1

- [x] T003 [US1] Add a Monorepo Notes bullet in `AGENTS.md` linking `specs/002-tidy-arch-alignment/plan.md` as the canonical **Tidy ↔ monorepo** mapping table (FR-001 discoverability; keep `CLAUDE.md` symlink unchanged)
- [x] T004 [US1] Add a **Peer review (SC-001)** subsection to `specs/002-tidy-arch-alignment/quickstart.md` stating that a second maintainer must approve the `plan.md` mapping table as accurate before the feature is considered closed

**Checkpoint**: Mapping is linked from canonical agent docs and SC-001 process is written — US1 documentation MVP met (peer sign-off is human gate).

---

## Phase 4: User Story 2 — Persistence behind explicit contracts (Priority: P2)

**Goal**: Adapter code depends on repository **ports** in its type surface; domain stays honest; core behavior is testable with fakes (FR-002, FR-003, SC-003).

**Independent Test**: `ApiEnv` uses `@dayparty/domain` repository interfaces; `pnpm --filter @dayparty/domain test` runs **create-task** and **get-rundown** core tests without Hono or Mongo.

### Implementation for User Story 2

- [x] T005 [US2] Retype `ApiEnv` in `apps/api/src/types.ts` so `userRepo`, `sessionRepo`, `tagRepo`, and `taskRepo` use `UserRepository`, `SessionRepository`, `TagRepository`, and `TaskRepository` from `@dayparty/domain` (remove `Mongo*` type imports from this file)
- [x] T006 [P] [US2] Add Vitest to `packages/domain/package.json` (`vitest` devDependency, `"test": "vitest run"` script) and create `packages/domain/vitest.config.ts` with `include: ['src/**/*.test.ts']` and `environment: 'node'` so `vitest.workspace.ts` at repository root picks up the package
- [x] T007 [US2] Add `packages/domain/src/actions/create-task.test.ts` calling `makeCreateTaskAction` with in-memory fake `TaskRepository` and `TagRepository` — cover at least one success path and one domain failure (e.g. missing tag), with **no** imports from `hono`, `@dayparty/db`, or `mongodb` (SC-003 — task create path)
- [x] T008 [US2] Add `packages/domain/src/actions/get-rundown.test.ts` calling `makeGetRundownAction` with a fake `TaskRepository` — assert `capacity` / `completed` match returned tasks (SC-003 — rundown path; **no** Hono/Mongo imports)

**Checkpoint**: API types honor ports; domain package has **two** core-level tests (create + rundown) — US2 meets v1 SC-003 for the task aggregate slice.

---

## Phase 5: User Story 3 — Composable application assembly (Priority: P3)

**Goal**: Composition stays explicit and localized; extension pattern documented (FR-004, US3 acceptance on one-offs).

**Independent Test**: README-style trace: env construction in one file; doc explains where to add optional routes without forking domain.

### Implementation for User Story 3

- [x] T009 [US3] Add a **Composition root (FR-004)** comment block at the top of `apps/api/src/index.ts` stating that new server-side repos/actions must be constructed and passed into `createApp` here (or a future extracted builder per `specs/002-tidy-arch-alignment/research.md`), not via globals
- [x] T010 [US3] Add an **Optional HTTP extensions** subsection to `specs/002-tidy-arch-alignment/quickstart.md` describing the agreed pattern: prefer registering extra routes in `apps/api/src/app.ts` (e.g. mounting additional `Hono` sub-apps or extending `createApp` **only when** the surface needs new dependencies); never fork domain logic inside `@dayparty/domain` for one-offs. Document today’s `createApp(env)` shape first; code changes are optional and only if the team adds a real extension hook.

**Checkpoint**: US3 documentation + inline traceability complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate build graph, commands, and leave no broken references after US2.

- [x] T011 [P] Run `pnpm build` from repository root and fix any TypeScript errors caused by `ApiEnv` port typing in `apps/api/src/types.ts`
- [x] T012 [P] Run `pnpm --filter @dayparty/domain test` from repository root; if `turbo run test` omits `@dayparty/domain`, ensure `packages/domain/package.json` exposes a `test` script and re-run `pnpm test` as needed
- [x] T013 [P] Align **Useful commands** in `specs/002-tidy-arch-alignment/quickstart.md` with the actual scripts after T006–T012 (e.g. confirm `pnpm --filter @dayparty/domain test` runs both `*.test.ts` files)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks US2 code (Phase 4)** and any work that claims checklist compliance for refactors; **does not block Phase 3 (US1)** docs
- **Phase 3 (US1)**: Depends on Phase 1 only (T003–T004 after T001)
- **Phases 4–5 (US2–US3)**: US2 requires Phase 2 complete before T005; US3 can follow US1 and may parallel US2 after T002 if staffed (shared files warrant caution)
- **Phase 6 (Polish)**: Depends on completion of intended user stories (minimum: US1 + US2 through **T008**)

### User Story Dependencies

- **US1 (P1)**: After Phase 1 — **no** Phase 2 requirement
- **US2 (P2)**: After Phase 2 — **T008** depends on **T006** and **T007**; **T005** can run before or in parallel with **T006**; **T007** and **T008** are sequential (same package, shared Vitest setup)
- **US3 (P3)**: After Phase 2 for consistency; logically after or with US2

### Suggested sequencing

1. T001 → (T002 ∥ T003, T004) — checklist audit in parallel with US1 docs; **T002 must finish before T005**
2. T005 → T006 → T007 → T008 (US2)
3. T009, T010 (US3)
4. T011 → T012 → T013

### Parallel Opportunities

- **T001** is alone in Phase 1
- **T002** parallel with **T003** / **T004** after T001
- **T006** [P] parallel with **T005** once Phase 2 is done (different paths: `packages/domain/*` vs `apps/api/src/types.ts`)
- **T011**, **T012**, **T013** in Phase 6 can run in parallel after code is stable (T013 may wait for T012 output)

---

## Parallel Example: User Story 2

```bash
# After T002, launch in parallel:
Task: "Retype ApiEnv repository fields in apps/api/src/types.ts …"
Task: "Add Vitest to packages/domain/package.json and packages/domain/vitest.config.ts …"

# Then sequential:
Task: "Add packages/domain/src/actions/create-task.test.ts …"
Task: "Add packages/domain/src/actions/get-rundown.test.ts …"
```

---

## Implementation Strategy

### MVP First (User Story 1 + checklist gate)

1. Complete Phase 1 (T001); run Phase 2 (T002) in parallel with Phase 3 (T003–T004) — but **finish T002 before T005**
2. Complete Phase 3 (T003–T004) — mapping discoverable + SC-001 process documented
3. **STOP and VALIDATE**: Peer review `plan.md` mapping when ready (SC-001)

### Incremental delivery (recommended)

1. US1 (docs) → US2 (`ApiEnv` + Vitest + `create-task` + `get-rundown` tests) → US3 (composition/extension docs) → Polish

### MVP scope note

Smallest shippable **architecture** MVP is **US1** (docs + links). Smallest increment that satisfies **SC-003** for v1 (task aggregate) requires **US2** through **T008**.

---

## Notes

- Do not introduce `BaseAction` / `BaseRequestHandler` from the reference unless a future slice proves they reduce duplication (constitution simplicity-first).
- `apps/web` and `apps/mobile` alignment can follow the same checklist per future slices; this `tasks.md` focuses on packages + `apps/api` as in `specs/002-tidy-arch-alignment/plan.md`. Tags/auth **domain** core tests are out of scope for v1 unless explicitly added later (see `spec.md` Assumptions).
- Each task uses checklist format: `- [ ] Tnnn …` with file path in the description.
