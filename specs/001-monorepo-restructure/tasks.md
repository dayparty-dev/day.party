# Tasks: Monorepo Restructure

**Input**: Design documents from `/specs/001-monorepo-restructure/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification — test tasks omitted. Tests can be added in a follow-up iteration. **Note**: SC-008 ("all shared packages have passing test suites") is deferred to the testing iteration.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize monorepo workspace, tooling, and shared TypeScript configuration

- [x] T001 Configure pnpm workspace with `pnpm-workspace.yaml` listing `packages/*` and `apps/*` workspaces at repository root
- [x] T002 Set `node-linker=hoisted` in `.npmrc` at repository root for NativeScript compatibility per research.md
- [x] T003 Configure `turbo.json` at repository root with build/test/lint/dev task graph per research.md (build→`dependsOn: ["^build"]`, test→`dependsOn: ["build"]`, dev→persistent+uncached, lint→parallel)
- [x] T004 Create `packages/typescript-config/` package with `base.json` (strict, `moduleResolution: "bundler"`, `module: "ESNext"`, `target: "ES2022"`), `library.json`, and `app.json` presets per research.md
- [x] T004a [P] Create `packages/eslint-config/` package with shared ESLint flat config — base rules for TypeScript (no `any` in packages, consistent imports), and app-specific overrides. Each package/app `eslint.config.js` extends the shared config. Satisfies FR-007.
- [x] T005 Configure `vitest.workspace.ts` at repository root with `defineWorkspace(["packages/*/vitest.config.ts", "apps/*/vitest.config.ts"])` per research.md
- [x] T006 Add root `package.json` scripts: `build`, `test`, `lint`, `dev` delegating to `turbo run`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create all shared packages with their core types, interfaces, schemas, and implementations that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Core Package

- [x] T007 Initialize `packages/core/` package with `package.json` (`name: @dayparty/core`), `tsconfig.json` extending `@dayparty/typescript-config/library.json`, and `src/index.ts` barrel export
- [x] T008 [P] Create Task type in `packages/core/src/models/task.ts` per data-model.md (id, userId, title, size 1–5, tagKey?, isComplete, scheduledDate, position, createdAt, updatedAt)
- [x] T009 [P] Create User type in `packages/core/src/models/user.ts` per data-model.md (id, email, displayName?, role, createdAt, updatedAt)
- [x] T010 [P] Create Session type in `packages/core/src/models/session.ts` per data-model.md (id, userId, token, expiresAt, createdAt)
- [x] T011 [P] Create Tag type in `packages/core/src/models/tag.ts` per data-model.md (id, userId, key, displayName, color?, icon?, isDefault, createdAt)
- [x] T012 [P] Create DayRundown type in `packages/core/src/models/day-rundown.ts` per data-model.md (date, userId, tasks, capacity, completed)
- [x] T013 [P] Create ApiError type in `packages/core/src/models/api-error.ts` per data-model.md error model (code, message, fields?)
- [x] T014 [P] Create constants in `packages/core/src/constants/` — default tags array, size scale (1–5), standard error codes (VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, INTERNAL_ERROR)
- [x] T015 Export all models and constants from `packages/core/src/index.ts` barrel

### Validation Package

- [ ] T016 Initialize `packages/validation/` package with `package.json` (`name: @dayparty/validation`, depends on `@dayparty/core`), `tsconfig.json`, and `src/index.ts` barrel
- [ ] T017 [P] Create task Zod schemas in `packages/validation/src/schemas/task.ts` — createTaskSchema, updateTaskSchema, reorderTasksSchema per data-model.md validation rules and contracts/rest-api.md request shapes
- [ ] T018 [P] Create user Zod schema in `packages/validation/src/schemas/user.ts` — loginSchema (email validation) per contracts/rest-api.md
- [ ] T019 [P] Create tag Zod schemas in `packages/validation/src/schemas/tag.ts` — createTagSchema, updateTagSchema per data-model.md validation rules and contracts/rest-api.md
- [ ] T020 [P] Create error utilities in `packages/validation/src/errors.ts` — `createApiError()`, `fromZodError()` mapping Zod issues to the ApiError shape with field-level detail per data-model.md error model
- [ ] T021 Export all schemas and error utilities from `packages/validation/src/index.ts` barrel

### Domain Package

- [ ] T022 Initialize `packages/domain/` package with `package.json` (`name: @dayparty/domain`, depends on `@dayparty/core`), `tsconfig.json`, and `src/index.ts` barrel
- [ ] T023 [P] Create TaskRepository interface in `packages/domain/src/interfaces/task-repository.ts` — findByUserAndDate, findById, create, update, delete, reorder methods matching contracts/rest-api.md operations
- [ ] T024 [P] Create UserRepository interface in `packages/domain/src/interfaces/user-repository.ts` — findById, findByEmail, create, update methods
- [ ] T025 [P] Create SessionRepository interface in `packages/domain/src/interfaces/session-repository.ts` — findByToken, create, deleteByToken, deleteExpired methods
- [ ] T026 [P] Create TagRepository interface in `packages/domain/src/interfaces/tag-repository.ts` — findByUser, findByKey, create, update, delete, seedDefaults methods
- [ ] T027 [P] Create CreateTaskAction in `packages/domain/src/actions/create-task.ts` — receives TaskRepository + TagRepository, validates tagKey exists, auto-assigns position, returns created Task
- [ ] T028 [P] Create ToggleTaskCompletionAction in `packages/domain/src/actions/toggle-task-completion.ts` — receives TaskRepository, toggles isComplete (true↔false), returns updated Task
- [ ] T029 [P] Create GetRundownAction in `packages/domain/src/actions/get-rundown.ts` — receives TaskRepository, queries by userId + date, computes capacity + completed count, returns DayRundown
- [ ] T030 [P] Create ReorderTasksAction in `packages/domain/src/actions/reorder-tasks.ts` — receives TaskRepository, validates all task IDs belong to user+date, updates positions, returns updated DayRundown
- [ ] T031 [P] Create DeleteTaskAction in `packages/domain/src/actions/delete-task.ts` — receives TaskRepository, deletes task, compacts remaining positions
- [ ] T032 [P] Create UpdateTaskAction in `packages/domain/src/actions/update-task.ts` — receives TaskRepository + TagRepository, partial update of task fields, validates tagKey if changed
- [ ] T033 Export all interfaces and actions from `packages/domain/src/index.ts` barrel

### DB Package

- [ ] T034 Initialize `packages/db/` package with `package.json` (`name: @dayparty/db`, depends on `@dayparty/core` + `@dayparty/domain` + `mongodb`), `tsconfig.json`, and `src/index.ts` barrel
- [ ] T035 Create MongoDB connection helper in `packages/db/src/connection.ts` — `getDb()`, `getCollection()` functions accepting connection URI
- [ ] T036 [P] Implement MongoTaskRepository in `packages/db/src/repositories/task-repository.ts` — implements TaskRepository interface from `@dayparty/domain` using MongoDB driver
- [ ] T037 [P] Implement MongoUserRepository in `packages/db/src/repositories/user-repository.ts` — implements UserRepository interface
- [ ] T038 [P] Implement MongoSessionRepository in `packages/db/src/repositories/session-repository.ts` — implements SessionRepository interface
- [ ] T039 [P] Implement MongoTagRepository in `packages/db/src/repositories/tag-repository.ts` — implements TagRepository interface including seedDefaults for new users per data-model.md default tags
- [ ] T040 Export all repository implementations and connection helper from `packages/db/src/index.ts` barrel

### API Client Package

- [ ] T041 Initialize `packages/api-client/` package with `package.json` (`name: @dayparty/api-client`, depends on `@dayparty/core` + `@dayparty/validation`), `tsconfig.json`, and `src/index.ts` barrel
- [ ] T042 Create DayPartyClient class in `packages/api-client/src/client.ts` — fetch-based HTTP client with `Result<T, ApiError>` return type, bearer token management, base URL config per research.md
- [ ] T043 [P] Add auth methods to DayPartyClient in `packages/api-client/src/client.ts` — login(email), verify(token), logout(), me() per contracts/rest-api.md auth endpoints
- [ ] T044 [P] Add task methods to DayPartyClient in `packages/api-client/src/client.ts` — getRundown(date), createTask(data), updateTask(id, data), deleteTask(id), reorderTasks(date, taskIds) per contracts/rest-api.md task endpoints
- [ ] T045 [P] Add tag methods to DayPartyClient in `packages/api-client/src/client.ts` — getTags(), createTag(data), updateTag(id, data), deleteTag(id) per contracts/rest-api.md tag endpoints
- [ ] T046 Export DayPartyClient and Result type from `packages/api-client/src/index.ts` barrel

**Checkpoint**: All 5 shared packages build successfully. `pnpm build` from root completes with no errors. Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Unified Workspace for Multi-Platform Development (Priority: P1) 🎯 MVP

**Goal**: Complete monorepo builds, tests, and lints from root. All packages resolve as workspace dependencies. Shared type changes propagate automatically.

**Independent Test**: `pnpm install && pnpm build && pnpm test && pnpm lint` succeeds from a fresh clone. Modify a type in `@dayparty/core` and run `pnpm build` — consuming apps rebuild.

- [ ] T047 [US1] Initialize `apps/api/` Hono app skeleton with `package.json` (`name: @dayparty/api`, depends on `@dayparty/core`, `@dayparty/domain`, `@dayparty/db`, `@dayparty/validation`, `hono`, `@hono/node-server`), `tsconfig.json`, and `apps/api/src/index.ts` entry point that starts the server
- [ ] T048 [P] [US1] Initialize `apps/web/` React app skeleton with `package.json` (`name: @dayparty/web`, depends on `@dayparty/core`, `@dayparty/api-client`, `react`, `react-dom`, `react-router`), `tsconfig.json`, `vite.config.ts`, `index.html`, and `apps/web/src/main.tsx` entry point
- [ ] T049 [P] [US1] Initialize `apps/mobile/` NativeScript 9 app skeleton with `package.json` (`name: @dayparty/mobile`, depends on `@dayparty/core`, `@dayparty/api-client`, `@nativescript/core`), `nativescript.config.ts`, `tsconfig.json`, and `apps/mobile/src/app.ts` bootstrap
- [ ] T050 [US1] Verify `apps/web-legacy/` existing Next.js app remains bootable independently with its own install/build — no shared package dependencies added
- [ ] T051 [US1] Run full workspace validation: `pnpm install && pnpm build && pnpm lint` from repository root — all packages and apps compile successfully in correct dependency order

**Checkpoint**: US1 complete — monorepo workspace is functional. Developer can clone, install, build, test, and lint everything with single commands.

---

## Phase 4: User Story 2 — REST API Serving All Clients (Priority: P2)

**Goal**: Fully functional Hono REST API with all 11 endpoints per contracts/rest-api.md, using shared packages for domain logic, validation, and data access.

**Independent Test**: Start API with `pnpm --filter @dayparty/api dev`, exercise all endpoints via curl/Postman — auth flow, task CRUD, rundown, reorder, tag CRUD all return correct responses per contract.

### API Middleware & Infrastructure

- [ ] T052 [US2] Create Hono app setup in `apps/api/src/app.ts` — initialize Hono instance, mount route groups, configure CORS
- [ ] T053 [US2] Create auth middleware in `apps/api/src/middleware/auth-middleware.ts` — extract bearer token from `Authorization` header, validate via SessionRepository, inject user context into Hono context; reject with 401 ApiError if invalid/expired
- [ ] T054 [US2] Create validation middleware in `apps/api/src/middleware/validate.ts` — generic Hono middleware that takes a Zod schema and validates request body, returning 422 ApiError with field details on failure using `@dayparty/validation` `fromZodError()`
- [ ] T055 [US2] Create error handler middleware in `apps/api/src/middleware/error-handler.ts` — catch-all Hono error handler that maps errors to ApiError response shape per data-model.md error model
- [ ] T056 [US2] Create dependency injection setup in `apps/api/src/index.ts` — instantiate MongoDB connection, repositories (MongoTask/User/Session/TagRepository), wire into actions, pass to route handlers

### Auth Routes

- [ ] T057 [US2] Implement POST /auth/login route in `apps/api/src/routes/auth.ts` — validate email via loginSchema, send magic-link email (stub email service for now), return 200 per contract
- [ ] T058 [US2] Implement GET /auth/verify route in `apps/api/src/routes/auth.ts` — verify magic-link token, create Session via SessionRepository, seed default tags for new users via TagRepository.seedDefaults, return bearer token + user per contract
- [ ] T059 [US2] Implement POST /auth/logout route in `apps/api/src/routes/auth.ts` — requires auth middleware, delete session via SessionRepository, return 200 per contract
- [ ] T060 [US2] Implement GET /auth/me route in `apps/api/src/routes/auth.ts` — requires auth middleware, return current user from context per contract

### Task Routes

- [ ] T061 [US2] Implement GET /tasks route in `apps/api/src/routes/tasks.ts` — requires auth middleware, validate `date` query param, call GetRundownAction, return DayRundown per contract
- [ ] T062 [US2] Implement POST /tasks route in `apps/api/src/routes/tasks.ts` — requires auth middleware, validate body via createTaskSchema, call CreateTaskAction, return 201 with created task per contract
- [ ] T063 [US2] Implement PATCH /tasks/:id route in `apps/api/src/routes/tasks.ts` — requires auth middleware, validate body via updateTaskSchema, call UpdateTaskAction, return updated task per contract
- [ ] T064 [US2] Implement DELETE /tasks/:id route in `apps/api/src/routes/tasks.ts` — requires auth middleware, call DeleteTaskAction, return 200 per contract
- [ ] T065 [US2] Implement PATCH /tasks/reorder route in `apps/api/src/routes/tasks.ts` — requires auth middleware, validate body via reorderTasksSchema, call ReorderTasksAction, return updated DayRundown per contract

### Tag Routes

- [ ] T066 [US2] Implement GET /tags route in `apps/api/src/routes/tags.ts` — requires auth middleware, query tags by userId, return array per contract
- [ ] T067 [US2] Implement POST /tags route in `apps/api/src/routes/tags.ts` — requires auth middleware, validate body via createTagSchema, check key uniqueness (409 on conflict), create tag, return 201 per contract
- [ ] T068 [US2] Implement PATCH /tags/:id route in `apps/api/src/routes/tags.ts` — requires auth middleware, validate body via updateTagSchema, update tag, return 200 per contract
- [ ] T069 [US2] Implement DELETE /tags/:id route in `apps/api/src/routes/tags.ts` — requires auth middleware, delete tag, nullify tagKey on referencing tasks, return 200 per contract

**Checkpoint**: US2 complete — all 11 API endpoints functional. Auth flow works end-to-end. Task CRUD, rundown retrieval, reordering, and tag management all return correct responses per contracts/rest-api.md.

---

## Phase 5: User Story 3 — Mobile App with Core Task Experience (Priority: P3)

**Goal**: NativeScript 9 mobile app with login, rundown, and ongoing screens consuming the REST API via `@dayparty/api-client`.

**Independent Test**: Install on iOS simulator or Android emulator. Log in, view rundown, mark task complete, navigate to ongoing view — all data flows through the live API.

### Mobile App Infrastructure

- [ ] T070 [US3] Set up NativeScript navigation in `apps/mobile/src/app.ts` — frame-based navigation between LoginView, RundownView, and OngoingView
- [ ] T071 [US3] Create AuthState singleton service in `apps/mobile/src/services/auth-state.ts` — manages bearer token in secure storage, exposes login/logout/isAuthenticated methods, uses `@dayparty/api-client` DayPartyClient

### Mobile Screens

- [ ] T072 [US3] Create LoginView in `apps/mobile/src/views/login-view.ts` — email input field, "Send magic link" button, calls DayPartyClient.login(); deep-link handler for magic-link verification that calls DayPartyClient.verify() and stores token via AuthState
- [ ] T073 [US3] Create RundownView in `apps/mobile/src/views/rundown-view.ts` — displays today's tasks as a list (title, size indicator, tag color, completion state), tap to toggle isComplete via DayPartyClient.updateTask(), navigate-to-ongoing button
- [ ] T074 [US3] Create OngoingView in `apps/mobile/src/views/ongoing-view.ts` — displays current/next incomplete task with title, size, tag, and a time/progress indicator; mark complete button; navigate back to rundown; handle app resume from background by restoring view state without resetting to login (edge case: "mobile app backgrounded during ongoing session")
- [ ] T075 [US3] Implement token expiration handling in `apps/mobile/src/services/auth-state.ts` — on 401 response from API client, clear stored token and navigate to LoginView preserving navigation stack context (FR-020)
- [ ] T075a [US3] Add basic network error handling in mobile views — when DayPartyClient calls fail due to API unreachability, display a clear error banner/message and offer a retry action (edge case: "API unreachable")

**Checkpoint**: US3 complete — mobile app login, rundown, and ongoing screens functional. User can authenticate, view tasks, mark complete, and focus on current task.

---

## Phase 6: User Story 4 — Web Client with Core Task Experience (Priority: P4)

**Goal**: Minimal React SPA with login, rundown, and ongoing pages consuming the REST API via `@dayparty/api-client`.

**Independent Test**: Open `http://localhost:5173` in browser. Log in, view rundown, mark task complete, navigate to ongoing view — all data flows through the live API.

### Web App Infrastructure

- [ ] T076 [US4] Set up React Router in `apps/web/src/App.tsx` — routes for `/login`, `/rundown`, `/ongoing`, redirect unauthenticated users to `/login`
- [ ] T077 [US4] Create useAuth hook in `apps/web/src/hooks/useAuth.ts` — manages bearer token in a React ref (in-memory only, never sessionStorage/localStorage — XSS-safe per FR-020a), exposes login/logout/isAuthenticated, wraps DayPartyClient auth methods, handles 401 by redirecting to login

### Web Pages

- [ ] T078 [US4] Create LoginPage in `apps/web/src/pages/LoginPage.tsx` — email input, submit button, calls DayPartyClient.login(); handle magic-link callback URL with token query param, call DayPartyClient.verify(), store token via useAuth
- [ ] T079 [US4] Create RundownPage in `apps/web/src/pages/RundownPage.tsx` — fetch today's rundown via DayPartyClient.getRundown(), render task list with TaskCard components (title, size, tag, completion toggle), toggle isComplete via DayPartyClient.updateTask()
- [ ] T080 [US4] Create TaskCard component in `apps/web/src/components/TaskCard.tsx` — displays task title, size badge, tag color indicator, completion checkbox; emits toggle event
- [ ] T081 [US4] Create OngoingPage in `apps/web/src/pages/OngoingPage.tsx` — displays current/next incomplete task with title, size, tag, and a time/progress indicator; mark complete button; link back to rundown
- [ ] T082 [US4] Add CSS Modules for core components in `apps/web/src/pages/*.module.css` and `apps/web/src/components/*.module.css` — minimal styling for login form, task list, task card, ongoing view
- [ ] T082a [US4] Add basic network error handling in web pages — when DayPartyClient calls fail due to API unreachability, display a clear error banner/message and offer a retry action (edge case: "API unreachable")

**Checkpoint**: US4 complete — web client login, rundown, and ongoing pages functional. Feature parity with mobile for core screens (SC-005).

---

## Phase 7: User Story 5 — Legacy App Preserved as Reference (Priority: P5)

**Goal**: Verify the legacy Next.js app remains bootable within the monorepo without any modifications.

**Independent Test**: `cd apps/web-legacy && pnpm install && pnpm dev` — app starts and behaves as before.

- [ ] T083 [US5] Verify `apps/web-legacy/` boots independently — run install and dev, confirm it starts without errors and is not affected by shared package changes
- [ ] T084 [US5] Ensure `apps/web-legacy/package.json` has NO dependencies on any `@dayparty/*` packages — cross-check that the legacy app is fully isolated from the new monorepo packages

**Checkpoint**: US5 complete — legacy app boots and behaves identically to pre-restructure state (SC-006).

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation alignment, and workspace-wide quality checks

- [ ] T085 [P] Update root `README.md` with project overview, quickstart commands, and package/app map per quickstart.md
- [ ] T086 [P] Update `CLAUDE.md` agent context with final project structure, commands, and conventions
- [ ] T087 Run quickstart.md validation — execute all commands from quickstart.md on a clean state and confirm they work as documented
- [ ] T088 Run full workspace validation — `pnpm install && pnpm build && pnpm test && pnpm lint` from root with zero errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Foundational — initializes app skeletons and validates workspace
- **US2 (Phase 4)**: Depends on US1 (API app skeleton must exist) — can start once T047 is done
- **US3 (Phase 5)**: Depends on US1 for mobile skeleton (T049) + US2 for live API to consume
- **US4 (Phase 6)**: Depends on US1 for web skeleton (T048) + US2 for live API to consume
- **US5 (Phase 7)**: Independent — can run any time after Phase 1
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Blocks US2, US3, US4 — app skeletons must exist
- **US2 (P2)**: Blocks US3, US4 — API must be running for clients to consume
- **US3 (P3)**: Independent of US4 — mobile and web can proceed in parallel after US2
- **US4 (P4)**: Independent of US3 — mobile and web can proceed in parallel after US2
- **US5 (P5)**: Fully independent of all other stories

### Within Each User Story

- Infrastructure/middleware before routes
- Models before services before endpoints
- Core implementation before integration

### Parallel Opportunities

- Phase 1 T001–T006: T001 first, then T002–T006 can run in parallel
- Phase 2: All `[P]`-marked tasks within each package can run in parallel; packages can also be worked in parallel since they only depend on each other at build time
- Phase 3: T048 and T049 can run in parallel (different apps)
- Phase 4: T052–T055 (middleware) then T057–T069 (routes) — route groups (auth, tasks, tags) can run in parallel
- Phase 5: T072–T074 (screens) can be worked partially in parallel once T070–T071 (infra) complete
- Phase 6: T078–T082 (pages) can be worked partially in parallel once T076–T077 (infra) complete
- Phase 5 and Phase 6 can proceed fully in parallel by different developers

---

## Parallel Example: Phase 2 Foundational

```
# All core models can be created in parallel:
T008: Task type in packages/core/src/models/task.ts
T009: User type in packages/core/src/models/user.ts
T010: Session type in packages/core/src/models/session.ts
T011: Tag type in packages/core/src/models/tag.ts
T012: DayRundown type in packages/core/src/models/day-rundown.ts
T013: ApiError type in packages/core/src/models/api-error.ts
T014: Constants in packages/core/src/constants/

# All validation schemas can be created in parallel (after core builds):
T017: Task schemas in packages/validation/src/schemas/task.ts
T018: User schemas in packages/validation/src/schemas/user.ts
T019: Tag schemas in packages/validation/src/schemas/tag.ts
T020: Error utilities in packages/validation/src/errors.ts

# All domain interfaces can be created in parallel:
T023: TaskRepository in packages/domain/src/interfaces/task-repository.ts
T024: UserRepository in packages/domain/src/interfaces/user-repository.ts
T025: SessionRepository in packages/domain/src/interfaces/session-repository.ts
T026: TagRepository in packages/domain/src/interfaces/tag-repository.ts

# All domain actions can be created in parallel:
T027–T032: All actions in packages/domain/src/actions/

# All DB implementations can be created in parallel:
T036–T039: All repositories in packages/db/src/repositories/

# API client methods can be created in parallel:
T043–T045: Auth, task, and tag methods in packages/api-client/src/client.ts
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (all shared packages)
3. Complete Phase 3: US1 — workspace builds end-to-end
4. Complete Phase 4: US2 — API fully functional
5. **STOP and VALIDATE**: API serves all contract endpoints correctly
6. This is the minimum viable backend — clients can be added incrementally

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Workspace functional (MVP structure)
3. US2 → API live (MVP backend)
4. US3 + US4 in parallel → Mobile + Web clients (MVP frontends)
5. US5 → Legacy verified (safety net)
6. Polish → Documentation and validation

### Parallel Team Strategy

With 2–3 developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 → US2 (sequential, API depends on app skeletons)
   - Developer B: US5 (quick, then assists with US2 routes)
3. Once US2 API is live:
   - Developer A: US3 (mobile)
   - Developer B: US4 (web)
4. Polish together
