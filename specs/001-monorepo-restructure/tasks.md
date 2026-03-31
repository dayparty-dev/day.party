# Tasks: Monorepo Restructure + API + Mobile Scaffold

**Input**: Design documents from `/specs/001-monorepo-restructure/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

> **Implementation rule** (constitution v2.1.0): New code MUST be designed from the
> specs, data model, and contracts below — NOT by copying or adapting legacy code.
> The legacy codebase in `apps/web-legacy/` is a vague reference only.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo scaffolding and workspace configuration

- [x] T001 [US1] Create root `pnpm-workspace.yaml` defining `packages/*` and `apps/*` workspaces
- [x] T002 [US1] Create root `turbo.json` with `build`, `dev`, and `clean` pipelines
- [x] T003 [US1] Create root `.npmrc` with `shamefully-hoist=true`
- [x] T004 [US1] Update root `package.json`: name `@dayparty/root`, add turbo scripts (`build`, `dev`, `clean`), remove app-level deps
- [x] T005 [US1] Move existing app to `apps/web-legacy/` and adjust `apps/web-legacy/package.json` (name `@dayparty/web-legacy`)

**Checkpoint**: Monorepo root structure exists. `pnpm install` resolves (no packages yet).

---

## Phase 2: Foundational Packages (Blocking Prerequisites)

**Purpose**: Shared packages that all apps depend on. Must be complete before any app work.

### packages/core

Types, models, and constants. Zero dependencies. Per contracts/packages.md.

- [ ] T006 [P] [US1] Create `packages/core/package.json` (`@dayparty/core`, type: module, exports map, build: tsc) and `tsconfig.json` (strict, declaration, outDir: dist, moduleResolution: bundler)
- [ ] T007 [US1] Define `Entity` base interface (`_id?: string`) → `packages/core/src/models/entity.ts` (per data-model.md)
- [ ] T008 [P] [US1] Define `Task` interface (extends Entity: title, size, duration, elapsedTime, status, scheduledAt, tags, order, userId, synced?, lastSyncedAt?) and `TaskStatus` type → `packages/core/src/models/task.ts` (per data-model.md)
- [ ] T009 [P] [US1] Define `User` interface (extends Entity: email, username, role) and `UserRole` type → `packages/core/src/models/user.ts` (per data-model.md)
- [ ] T010 [P] [US1] Define `TagOption` interface (label, color) → `packages/core/src/models/tag.ts` (per data-model.md)
- [ ] T011 [P] [US1] Define `AuthSession` interface (extends Entity: email, sessionId, active, createdAt) → `packages/core/src/auth/session.ts` (per data-model.md)
- [ ] T012 [P] [US1] Define `AuthToken`, `AuthTokenJwt`, `AuthTokenSigningInput`, `AuthTokenVerificationInput` → `packages/core/src/auth/token.ts` (per data-model.md + contracts/packages.md)
- [ ] T013 [P] [US1] Define `EmailMessage` (subject, html, text) and `EmailSendInput` (to, message) → `packages/core/src/email/message.ts` (per contracts/packages.md)
- [ ] T014 [P] [US1] Define `CookieName` constant enum → `packages/core/src/constants/cookies.ts`
- [ ] T015 [P] [US1] Define `Interactor<I, O>` generic interface → `packages/core/src/patterns/interactor.ts`
- [ ] T016 [US1] Create barrel export `packages/core/src/index.ts` re-exporting all public types per contracts/packages.md

### packages/domain

Business logic, repository interfaces, service interfaces. Depends on `@dayparty/core` only.

- [ ] T017 [P] [US1] Create `packages/domain/package.json` (`@dayparty/domain`, deps: `@dayparty/core`) and `tsconfig.json`
- [ ] T018 [US1] Define `AuthSessionRepo` interface (create, findBySessionId, markActive, delete) → `packages/domain/src/repos/auth-session-repo.ts` (per contracts/packages.md)
- [ ] T019 [P] [US1] Define `UserRepo` interface (findById, findByEmail, create, updateRole, search) → `packages/domain/src/repos/user-repo.ts` (per contracts/packages.md)
- [ ] T020 [P] [US1] Define `TaskRepo` interface (findByUserAndDate, findByUser, create, update, delete, deleteByUserAndDate, bulkSync) → `packages/domain/src/repos/task-repo.ts` (per contracts/packages.md)
- [ ] T021 [P] [US1] Define `AuthTokenService` interface (sign, verify) → `packages/domain/src/services/auth-token-service.ts`
- [ ] T022 [P] [US1] Define `EmailService` interface (sendEmail) → `packages/domain/src/services/email-service.ts`
- [ ] T023 [US1] Implement `createAuthSession` interactor (deps: AuthSessionRepo + EmailService, creates session + sends magic-link email) → `packages/domain/src/interactors/create-auth-session.ts` (per contracts/packages.md interactor pattern)
- [ ] T024 [US1] Implement `verifyAuthSession` interactor (deps: AuthSessionRepo + UserRepo + AuthTokenService, marks active + finds/creates user + signs JWT) → `packages/domain/src/interactors/verify-auth-session.ts`
- [ ] T025 [US1] Implement `deleteAuthSession` interactor (deps: AuthSessionRepo, deletes session) → `packages/domain/src/interactors/delete-auth-session.ts`
- [ ] T026 [US1] Implement `authenticateOtherUser` interactor (deps: UserRepo + AuthTokenService, admin signs JWT for another user) → `packages/domain/src/interactors/authenticate-other-user.ts`
- [ ] T027 [P] [US1] Implement `groupTasksByDate` and `sortTasksByOrder` utils → `packages/domain/src/utils/tasks.ts`
- [ ] T028 [US1] Create barrel export `packages/domain/src/index.ts` re-exporting all public items per contracts/packages.md

### packages/db

MongoDB implementations of repository interfaces. Per data-model.md indexes and collections.

- [ ] T029 [P] [US1] Create `packages/db/package.json` (`@dayparty/db`, deps: `@dayparty/core`, `@dayparty/domain`, `mongodb`) and `tsconfig.json`
- [ ] T030 [US1] Implement MongoDB connection helper (getDb singleton, getCollection typed helper) → `packages/db/src/connection.ts`
- [ ] T031 [US1] Implement `MongoAuthSessionRepo` (implements `AuthSessionRepo`, collection: `auth_sessions`, indexes: sessionId unique + createdAt TTL) → `packages/db/src/repos/mongo-auth-session-repo.ts`
- [ ] T032 [US1] Implement `MongoUserRepo` (implements `UserRepo`, collection: `users`, index: email unique) → `packages/db/src/repos/mongo-user-repo.ts`
- [ ] T033 [US1] Implement `MongoTaskRepo` (implements `TaskRepo`, collection: `tasks`, indexes: userId+scheduledAt, userId+status) → `packages/db/src/repos/mongo-task-repo.ts`
- [ ] T034 [US1] Create barrel export `packages/db/src/index.ts`

### packages/validation

Zod schemas for input validation at system boundaries.

- [ ] T035 [P] [US1] Create `packages/validation/package.json` (`@dayparty/validation`, deps: `@dayparty/core`, `zod`) and `tsconfig.json`
- [ ] T036 [US1] Define `loginEmailSchema` (validates email string) → `packages/validation/src/auth.ts`
- [ ] T037 [P] [US1] Define `taskCreateSchema` and `taskUpdateSchema` (validate Task creation/update payloads per data-model.md) → `packages/validation/src/task.ts`
- [ ] T038 [US1] Create barrel export `packages/validation/src/index.ts`

### packages/api-client

Typed HTTP client for consuming the Hono API. Per contracts/packages.md `ApiClient` shape.

- [ ] T039 [P] [US1] Create `packages/api-client/package.json` (`@dayparty/api-client`, deps: `@dayparty/core`) and `tsconfig.json`
- [ ] T040 [US1] Define `ApiConfig`, `ApiResponse<T>`, `ApiError` types → `packages/api-client/src/types.ts` (per contracts/packages.md)
- [ ] T041 [US1] Implement base fetch wrapper with JWT auth header injection → `packages/api-client/src/client.ts` (per contracts/packages.md `ApiConfig`)
- [ ] T042 [US1] Implement auth methods (login, verify, logout) → `packages/api-client/src/auth.ts` (per contracts/api-routes.md auth routes)
- [ ] T043 [US1] Implement task methods (list, create, update, delete, deleteByDate, sync) → `packages/api-client/src/tasks.ts` (per contracts/api-routes.md task routes)
- [ ] T044 [US1] Implement admin methods (searchUsers, updateRole, authAs) → `packages/api-client/src/admin.ts` (per contracts/api-routes.md admin routes)
- [ ] T045 [US1] Create barrel export with `createApiClient` factory → `packages/api-client/src/index.ts` (per contracts/packages.md)

**Checkpoint**: `pnpm build` from root builds all 5 packages. Each produces `dist/` with `.d.ts` files. **SC-001, SC-002, SC-007 met.**

---

## Phase 3: User Story 2 — API serves task and auth endpoints (Priority: P2)

**Goal**: Hono REST API exposing all endpoints from contracts/api-routes.md

**Independent Test**: `curl http://localhost:3001/api/health` returns 200

- [ ] T046 [P] [US2] Create `apps/api/package.json` (`@dayparty/api`, deps: hono, @hono/node-server, all @dayparty/\* packages) and `tsconfig.json`
- [ ] T047 [US2] Create Hono app entry with health route (`GET /api/health`) → `apps/api/src/index.ts` (serves on port 3001 per quickstart.md)
- [ ] T048 [US2] Implement JWT auth middleware (verify token, attach user context to Hono context) → `apps/api/src/middleware/auth.ts`
- [ ] T049 [US2] Implement `AuthTokenService` concretely using jsonwebtoken (sign + verify per research.md D7) → `apps/api/src/services/jwt-auth-token-service.ts`
- [ ] T050 [P] [US2] Implement `EmailService` concretely — `FakeEmailService` (console.log in dev) → `apps/api/src/services/fake-email-service.ts`
- [ ] T051 [P] [US2] Implement `EmailService` concretely — `ResendEmailService` (Resend API for production) → `apps/api/src/services/resend-email-service.ts`
- [ ] T052 [US2] Create dependency wiring (instantiate repos + services, inject into interactors, select email service by env) → `apps/api/src/deps.ts`
- [ ] T053 [US2] Implement auth routes (POST /login, /verify, /logout) per contracts/api-routes.md → `apps/api/src/routes/auth.ts`
- [ ] T054 [US2] Implement task routes (GET/POST/PATCH/DELETE /tasks, POST /tasks/sync) per contracts/api-routes.md → `apps/api/src/routes/tasks.ts`
- [ ] T055 [US2] Implement admin routes (GET /admin/users, PATCH role, POST auth-as) per contracts/api-routes.md → `apps/api/src/routes/admin.ts`
- [ ] T056 [US2] Create `.env.example` in `apps/api/` with all required env vars per quickstart.md

**Checkpoint**: API starts. `curl /api/health` → 200. Auth flow works end-to-end. **SC-003, SC-004 met.**

---

## Phase 4: User Story 3 — NativeScript app launches with login (Priority: P3)

**Goal**: Mobile app builds, launches, shows login screen connected to API

**Independent Test**: `ns run ios` → app shows email input

- [ ] T057 [US3] Create `apps/mobile/package.json` (`@dayparty/mobile`, deps: @nativescript/core, @dayparty/api-client, @dayparty/core)
- [ ] T058 [P] [US3] Create `apps/mobile/nativescript.config.ts` with workspace package mappings (per research.md NativeScript constraint)
- [ ] T059 [P] [US3] Create `apps/mobile/vite.config.ts` with NativeScript Vite plugin (per research.md D3)
- [ ] T060 [P] [US3] Create `apps/mobile/references.d.ts` for NativeScript type references
- [ ] T061 [US3] Create app entry (`src/app.ts` — Application.run) + root frame (`src/app-root.xml`) per contracts/mobile-screens.md nav flow
- [ ] T062 [US3] Implement auth service (SecureStorage: getToken, setToken, clearToken, isAuthenticated) → `apps/mobile/src/services/auth-service.ts` (per contracts/mobile-screens.md)
- [ ] T063 [US3] Implement navigation helper (navigateTo with clearHistory support) → `apps/mobile/src/utils/navigation.ts` (per contracts/mobile-screens.md)
- [ ] T064 [US3] Create login screen layout (email input, submit button, status label, verify flow) → `apps/mobile/src/views/login/login-page.xml` (per contracts/mobile-screens.md Screen 1)
- [ ] T065 [US3] Create login screen code-behind (calls api-client auth.login + auth.verify, stores token, navigates to rundown) → `apps/mobile/src/views/login/login-page.ts` (per contracts/mobile-screens.md Screen 1)

**Checkpoint**: `ns run ios` launches app with login screen. Login flow calls API. **SC-005 met.**

---

## Phase 5: User Story 4 — Mobile task list (Priority: P4)

**Goal**: After login, user sees today's tasks and can manage them

**Independent Test**: Create task on mobile, see it in list, change status

- [ ] T066 [US4] Implement task service (wraps api-client tasks, local caching via ApplicationSettings) → `apps/mobile/src/services/task-service.ts` (per contracts/mobile-screens.md)
- [ ] T067 [US4] Create rundown screen layout (ActionBar with date nav, progress bar, ListView, add button) → `apps/mobile/src/views/rundown/rundown-page.xml` (per contracts/mobile-screens.md Screen 2)
- [ ] T068 [US4] Create rundown screen code-behind (fetch tasks, day navigation, add task dialog, tap to start/resume) → `apps/mobile/src/views/rundown/rundown-page.ts` (per contracts/mobile-screens.md Screen 2)
- [ ] T069 [US4] Create ongoing screen layout (task title, timer, tag badges, pause/complete buttons) → `apps/mobile/src/views/ongoing/ongoing-page.xml` (per contracts/mobile-screens.md Screen 3)
- [ ] T070 [US4] Create ongoing screen code-behind (setInterval timer, pause→paused, complete→done, update via api-client) → `apps/mobile/src/views/ongoing/ongoing-page.ts` (per contracts/mobile-screens.md Screen 3)

**Checkpoint**: Full mobile flow: login → see tasks → add task → start task → timer → complete. **FR-009, FR-010 met.**

---

## Phase 6: User Story 5 — Minimal web client (Priority: P5)

**Goal**: Validate api-client works from browser/React context

**Independent Test**: Open browser, see today's tasks

- [ ] T071 [US5] Create `apps/web/package.json` (`@dayparty/web`, deps: react, react-dom, @dayparty/api-client, @dayparty/core, vite) and `tsconfig.json`, `index.html`, `vite.config.ts` (per research.md D5)
- [ ] T072 [US5] Create entry + App component → `apps/web/src/main.tsx`, `apps/web/src/App.tsx`
- [ ] T073 [US5] Create login page (email form, calls api-client auth) → `apps/web/src/pages/Login.tsx`
- [ ] T074 [US5] Create task list page (fetch and display today's tasks via api-client) → `apps/web/src/pages/TaskList.tsx`

**Checkpoint**: Web client shows tasks from API. **SC-006, FR-012 met.**

---

## Summary

| Phase           | Tasks     | Dependencies      | User Story         |
| --------------- | --------- | ----------------- | ------------------ |
| 1. Setup        | T001–T005 | None              | US1 (foundation)   |
| 2. Packages     | T006–T045 | Phase 1           | US1 (build passes) |
| 3. API          | T046–T056 | Phase 2           | US2                |
| 4. Mobile Login | T057–T065 | Phase 2 + Phase 3 | US3                |
| 5. Mobile Tasks | T066–T070 | Phase 4           | US4                |
| 6. Web Client   | T071–T074 | Phase 2 + Phase 3 | US5                |

**Total**: 74 tasks across 6 phases
**Critical path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
**Parallel after Phase 2**: Phase 3 (API) can run in parallel with Phase 6 (Web) once packages build
