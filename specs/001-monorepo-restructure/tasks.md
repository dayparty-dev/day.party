# Tasks: Monorepo Restructure + API + Mobile Scaffold

**Input**: Design documents from `/specs/001-monorepo-restructure/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo scaffolding and workspace configuration

- [ ] T001 [US1] Create root `pnpm-workspace.yaml` defining `packages/*` and `apps/*` workspaces
- [ ] T002 [US1] Create root `turbo.json` with `build`, `dev`, and `clean` pipelines
- [ ] T003 [US1] Create root `.npmrc` with `shamefully-hoist=true`
- [ ] T004 [US1] Update root `package.json`: name `@dayparty/root`, add turbo scripts (`build`, `dev`, `clean`), remove app-level deps
- [ ] T005 [US1] Move existing app to `apps/web-legacy/`: relocate `app/`, `lib/`, `public/`, `next.config.js`, `tsconfig.json`, `postcss.config.mjs`, `next-i18next.config.js`, `next-env.d.ts`, `tailwind.config.ts` and adjust `apps/web-legacy/package.json` (name `@dayparty/web-legacy`)

**Checkpoint**: Monorepo root structure exists. `pnpm install` resolves (no packages yet).

---

## Phase 2: Foundational Packages (Blocking Prerequisites)

**Purpose**: Shared packages that all apps depend on. Must be complete before any app work.

### packages/core

- [ ] T006 [P] [US1] Create `packages/core/package.json` (`@dayparty/core`, type: module, exports map, build script: tsc)
- [ ] T007 [P] [US1] Create `packages/core/tsconfig.json` (strict, declaration, outDir: dist)
- [ ] T008 [US1] Extract `Entity` interface → `packages/core/src/models/entity.ts` (from `app/_models/Entity.ts`)
- [ ] T009 [P] [US1] Extract `Task`, `TaskStatus` → `packages/core/src/models/task.ts` (from `app/_models/Task.ts`)
- [ ] T010 [P] [US1] Extract `User`, `UserRole` → `packages/core/src/models/user.ts` (from `app/user/_models/User.ts`)
- [ ] T011 [P] [US1] Extract `TagOption` → `packages/core/src/models/tag.ts` (from `app/_stores/useTagStore.ts`, type only)
- [ ] T012 [P] [US1] Extract `AuthSession` → `packages/core/src/auth/session.ts` (from `app/auth/_models/AuthSession.ts`)
- [ ] T013 [P] [US1] Extract `AuthToken`, `AuthTokenJwt`, `AuthTokenSigningInput`, `AuthTokenVerificationInput` → `packages/core/src/auth/` (from `app/auth/_models/`)
- [ ] T014 [P] [US1] Extract `EmailMessage`, `EmailSendInput` → `packages/core/src/email/` (from `app/_models/`)
- [ ] T015 [P] [US1] Extract `CookieName` → `packages/core/src/constants/cookies.ts` (from `app/_services/cookieNames.ts`)
- [ ] T016 [P] [US1] Extract `Interactor<I,O>` → `packages/core/src/patterns/interactor.ts` (from `app/_models/modules/Interactor.ts`)
- [ ] T017 [US1] Create `packages/core/src/index.ts` barrel export for all types

### packages/domain

- [ ] T018 [P] [US1] Create `packages/domain/package.json` (`@dayparty/domain`, deps: `@dayparty/core`)
- [ ] T019 [P] [US1] Create `packages/domain/tsconfig.json`
- [ ] T020 [US1] Define `AuthSessionRepo` interface → `packages/domain/src/repos/auth-session-repo.ts` (per contracts/packages.md)
- [ ] T021 [P] [US1] Define `UserRepo` interface → `packages/domain/src/repos/user-repo.ts`
- [ ] T022 [P] [US1] Define `TaskRepo` interface → `packages/domain/src/repos/task-repo.ts`
- [ ] T023 [P] [US1] Define `AuthTokenService` interface → `packages/domain/src/services/auth-token-service.ts` (from `app/auth/_services/AuthTokenService.ts`)
- [ ] T024 [P] [US1] Define `EmailService` interface → `packages/domain/src/services/email-service.ts` (from `app/_services/EmailService.ts`)
- [ ] T025 [US1] Refactor `createAuthSession` → `packages/domain/src/interactors/create-auth-session.ts` (receive deps as params, from `app/auth/_interactors/CreateAuthSessionInteractor.ts`)
- [ ] T026 [US1] Refactor `verifyAuthSession` → `packages/domain/src/interactors/verify-auth-session.ts`
- [ ] T027 [US1] Refactor `deleteAuthSession` → `packages/domain/src/interactors/delete-auth-session.ts`
- [ ] T028 [US1] Refactor `authenticateOtherUser` → `packages/domain/src/interactors/authenticate-other-user.ts`
- [ ] T029 [P] [US1] Extract `groupTasksByDate`, `sortTasksByOrder` → `packages/domain/src/utils/tasks.ts` (from `app/_utils/tasksUtils.ts`)
- [ ] T030 [US1] Create `packages/domain/src/index.ts` barrel export

### packages/db

- [ ] T031 [P] [US1] Create `packages/db/package.json` (`@dayparty/db`, deps: `@dayparty/core`, `@dayparty/domain`, `mongodb`)
- [ ] T032 [P] [US1] Create `packages/db/tsconfig.json`
- [ ] T033 [US1] Extract MongoDB connection → `packages/db/src/connection.ts` (from `lib/mongodb.ts`)
- [ ] T034 [US1] Implement `MongoAuthSessionRepo` → `packages/db/src/repos/mongo-auth-session-repo.ts` (implements `AuthSessionRepo`)
- [ ] T035 [US1] Implement `MongoUserRepo` → `packages/db/src/repos/mongo-user-repo.ts` (implements `UserRepo`)
- [ ] T036 [US1] Implement `MongoTaskRepo` → `packages/db/src/repos/mongo-task-repo.ts` (implements `TaskRepo`)
- [ ] T037 [US1] Create `packages/db/src/index.ts` barrel export

### packages/validation

- [ ] T038 [P] [US1] Create `packages/validation/package.json` (`@dayparty/validation`, deps: `@dayparty/core`, `zod`)
- [ ] T039 [P] [US1] Create `packages/validation/tsconfig.json`
- [ ] T040 [US1] Create `loginEmailSchema` → `packages/validation/src/auth.ts`
- [ ] T041 [P] [US1] Create `taskCreateSchema`, `taskUpdateSchema` → `packages/validation/src/task.ts`
- [ ] T042 [US1] Create `packages/validation/src/index.ts` barrel export

### packages/api-client

- [ ] T043 [P] [US1] Create `packages/api-client/package.json` (`@dayparty/api-client`, deps: `@dayparty/core`)
- [ ] T044 [P] [US1] Create `packages/api-client/tsconfig.json`
- [ ] T045 [US1] Create base fetch wrapper with JWT auth header → `packages/api-client/src/client.ts` (per contracts/packages.md `ApiClient` / `ApiConfig`)
- [ ] T046 [US1] Create auth methods (login, verify, logout) → `packages/api-client/src/auth.ts`
- [ ] T047 [US1] Create task methods (list, create, update, delete, sync) → `packages/api-client/src/tasks.ts`
- [ ] T048 [P] [US1] Create `ApiResponse`, `ApiError` types → `packages/api-client/src/types.ts`
- [ ] T049 [US1] Create `packages/api-client/src/index.ts` barrel export

**Checkpoint**: `pnpm build` from root builds all 5 packages. Each produces `dist/` with `.d.ts` files. **SC-001, SC-002, SC-007 met.**

---

## Phase 3: User Story 2 — API serves task and auth endpoints (Priority: P2)

**Goal**: Hono REST API exposing all endpoints from contracts/api-routes.md

**Independent Test**: `curl http://localhost:3001/api/health` returns 200

- [ ] T050 [US2] Create `apps/api/package.json` (`@dayparty/api`, deps: hono, @hono/node-server, @dayparty/core, @dayparty/domain, @dayparty/db, @dayparty/validation)
- [ ] T051 [P] [US2] Create `apps/api/tsconfig.json`
- [ ] T052 [US2] Create Hono app entry + health route → `apps/api/src/index.ts` (serves on port 3001)
- [ ] T053 [US2] Implement JWT auth middleware → `apps/api/src/middleware/auth.ts` (verify JWT, attach user to context)
- [ ] T054 [US2] Implement concrete `JsonWebTokenAuthTokenService` → `apps/api/src/services/jwt-auth-token-service.ts` (move from `app/auth/_services/JsonWebTokenAuthTokenService.ts`)
- [ ] T055 [P] [US2] Implement concrete `FakeEmailService` → `apps/api/src/services/fake-email-service.ts` (move from `app/_services/FakeEmailService.ts`)
- [ ] T056 [P] [US2] Implement concrete `ResendEmailService` → `apps/api/src/services/resend-email-service.ts` (move from `app/_services/ResendEmailService.ts`)
- [ ] T057 [US2] Create dependency wiring (instantiate repos + services, inject into interactors) → `apps/api/src/deps.ts`
- [ ] T058 [US2] Implement auth routes (POST /login, /verify, /logout) → `apps/api/src/routes/auth.ts` (per contracts/api-routes.md)
- [ ] T059 [US2] Implement task routes (GET/POST/PATCH/DELETE /tasks, POST /tasks/sync) → `apps/api/src/routes/tasks.ts`
- [ ] T060 [US2] Implement admin routes (GET /admin/users, PATCH role, POST auth-as) → `apps/api/src/routes/admin.ts`
- [ ] T061 [US2] Create `.env.example` in `apps/api/` with all required env vars

**Checkpoint**: API starts. `curl /api/health` → 200. Auth flow works end-to-end. **SC-003, SC-004 met.**

---

## Phase 4: User Story 3 — NativeScript app launches with login (Priority: P3)

**Goal**: Mobile app builds, launches, shows login screen connected to API

**Independent Test**: `ns run ios` → app shows email input

- [ ] T062 [US3] Create `apps/mobile/package.json` (`@dayparty/mobile`, deps: @nativescript/core, @dayparty/api-client, @dayparty/core)
- [ ] T063 [P] [US3] Create `apps/mobile/nativescript.config.ts` with workspace package mappings
- [ ] T064 [P] [US3] Create `apps/mobile/vite.config.ts` with NativeScript Vite plugin
- [ ] T065 [P] [US3] Create `apps/mobile/references.d.ts` for NativeScript type references
- [ ] T066 [US3] Create `apps/mobile/src/app.ts` (Application.run entry) + `apps/mobile/src/app-root.xml` (root Frame)
- [ ] T067 [US3] Create auth service → `apps/mobile/src/services/auth-service.ts` (SecureStorage token, `getToken`/`setToken`/`clearToken`)
- [ ] T068 [US3] Create navigation helper → `apps/mobile/src/utils/navigation.ts`
- [ ] T069 [US3] Create login screen layout → `apps/mobile/src/views/login/login-page.xml` (email input, submit button, status label)
- [ ] T070 [US3] Create login screen code-behind → `apps/mobile/src/views/login/login-page.ts` (calls api-client auth.login + auth.verify, stores token, navigates to rundown)

**Checkpoint**: `ns run ios` launches app with login screen. Login flow calls API. **SC-005 met.**

---

## Phase 5: User Story 4 — Mobile task list (Priority: P4)

**Goal**: After login, user sees today's tasks and can manage them

**Independent Test**: Create task on mobile, see it in list, change status

- [ ] T071 [US4] Create task service → `apps/mobile/src/services/task-service.ts` (wraps api-client tasks, local caching via ApplicationSettings)
- [ ] T072 [US4] Create rundown screen layout → `apps/mobile/src/views/rundown/rundown-page.xml` (ActionBar with date nav, progress bar, ListView, add button)
- [ ] T073 [US4] Create rundown screen code-behind → `apps/mobile/src/views/rundown/rundown-page.ts` (fetch tasks, day navigation, add task dialog, tap to start)
- [ ] T074 [US4] Create ongoing screen layout → `apps/mobile/src/views/ongoing/ongoing-page.xml` (task title, timer, pause/complete buttons)
- [ ] T075 [US4] Create ongoing screen code-behind → `apps/mobile/src/views/ongoing/ongoing-page.ts` (timer via setInterval, pause/complete update via api-client)

**Checkpoint**: Full mobile flow: login → see tasks → add task → start task → timer → complete. **FR-009, FR-010 met.**

---

## Phase 6: User Story 5 — Minimal web client (Priority: P5)

**Goal**: Validate api-client works from browser/React context

**Independent Test**: Open browser, see today's tasks

- [ ] T076 [US5] Create `apps/web/package.json` (`@dayparty/web`, deps: react, react-dom, @dayparty/api-client, @dayparty/core, vite)
- [ ] T077 [P] [US5] Create `apps/web/tsconfig.json`, `apps/web/index.html`, `apps/web/vite.config.ts`
- [ ] T078 [US5] Create entry + App component → `apps/web/src/main.tsx`, `apps/web/src/App.tsx`
- [ ] T079 [US5] Create login page → `apps/web/src/pages/Login.tsx` (email form, calls api-client)
- [ ] T080 [US5] Create task list page → `apps/web/src/pages/TaskList.tsx` (fetch and display today's tasks)

**Checkpoint**: Web client shows tasks from API. **SC-006, FR-012 met.**

---

## Summary

| Phase           | Tasks     | Dependencies      | User Story         |
| --------------- | --------- | ----------------- | ------------------ |
| 1. Setup        | T001–T005 | None              | US1 (foundation)   |
| 2. Packages     | T006–T049 | Phase 1           | US1 (build passes) |
| 3. API          | T050–T061 | Phase 2           | US2                |
| 4. Mobile Login | T062–T070 | Phase 2 + Phase 3 | US3                |
| 5. Mobile Tasks | T071–T075 | Phase 4           | US4                |
| 6. Web Client   | T076–T080 | Phase 2 + Phase 3 | US5                |

**Total**: 80 tasks across 6 phases
**Critical path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
**Parallel after Phase 2**: Phase 3 (API) can run in parallel with Phase 6 (Web) once packages build
