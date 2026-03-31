# Feature Specification: Monorepo Restructure + API + Mobile Scaffold

**Feature Branch**: `001-monorepo-restructure`
**Created**: 2026-03-31
**Status**: Draft
**Input**: Restructure project as TypeScript monorepo with Turborepo, extract shared packages, create Hono API backend, and scaffold NativeScript 9 mobile app

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Developer runs `pnpm install` and `pnpm build` from root (Priority: P1)

A developer clones the repo and runs the standard install and build commands from
the monorepo root. All packages compile, type-check, and produce their outputs
without errors. This is the foundation — nothing else works without it.

**Why this priority**: If the monorepo structure doesn't resolve dependencies and
build correctly, nothing else in this spec is possible.

**Independent Test**: Run `pnpm install && pnpm build` from root. All packages
and apps produce build output without errors.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repo, **When** `pnpm install` is run from root,
   **Then** all workspace dependencies resolve without errors.
2. **Given** a successful install, **When** `pnpm build` is run from root,
   **Then** Turborepo builds all packages in dependency order and all produce `dist/` output.
3. **Given** the built packages, **When** any app imports from `@dayparty/core`,
   **Then** TypeScript resolves the types correctly without path errors.

---

### User Story 2 — API serves task and auth endpoints (Priority: P2)

The Hono API starts and exposes endpoints equivalent to the existing server
actions: auth (login/verify/logout) and tasks (CRUD + sync). It uses the
shared domain interactors and MongoDB repos. A developer can test it with curl.

**Why this priority**: The API is the bridge between shared packages and all
clients (mobile, future web). It validates that the extracted domain logic
actually works end-to-end through HTTP.

**Independent Test**: Start the API server, call `POST /api/auth/login` with
an email, receive a session. Call `GET /api/tasks` with a valid JWT, receive
a task list.

**Acceptance Scenarios**:

1. **Given** the API is running and MongoDB is available, **When** `POST /api/auth/login`
   is called with a valid email, **Then** a magic-link auth session is created and
   an email is sent (or logged in dev mode).
2. **Given** a valid JWT token, **When** `GET /api/tasks` is called, **Then** the
   user's tasks are returned as JSON.
3. **Given** a valid JWT token, **When** `POST /api/tasks` is called with task data,
   **Then** a new task is created and returned.
4. **Given** no token or an invalid token, **When** any protected endpoint is called,
   **Then** a 401 response is returned.

---

### User Story 3 — NativeScript app launches and shows login screen (Priority: P3)

The NativeScript 9 mobile app is scaffolded, builds, and launches on an iOS
simulator or Android emulator. It displays a login screen that uses the
shared `api-client` package to communicate with the Hono API.

**Why this priority**: This validates the full chain: mobile → api-client →
API → domain → database. It proves the monorepo structure supports a
NativeScript consumer.

**Independent Test**: Run `ns run ios` from `apps/mobile/`. The app launches
and displays a login screen with an email input field.

**Acceptance Scenarios**:

1. **Given** the mobile project is set up, **When** `ns run ios` is executed,
   **Then** the app compiles and launches in the iOS simulator.
2. **Given** the app is running, **When** the user sees the login screen,
   **Then** there is an email input and a submit button.
3. **Given** the API is running, **When** the user enters an email and taps submit,
   **Then** the app calls the API via `api-client` and shows a "check your email" message.

---

### User Story 4 — Mobile app shows task list for current day (Priority: P4)

After authenticating, the mobile app displays the user's tasks for the current
day in a native list view, with the ability to add a new task and toggle task
status. This maps the core rundown functionality from the existing web app.

**Why this priority**: This is the primary use case of day.party on mobile. It
validates that the domain logic (task CRUD, status management, day-based
grouping) works correctly through the full stack.

**Independent Test**: Log in on mobile, create a task, see it in the list,
toggle it to "ongoing", see the status reflected.

**Acceptance Scenarios**:

1. **Given** an authenticated user with existing tasks, **When** the rundown
   screen loads, **Then** tasks for today are displayed in a native list.
2. **Given** the rundown screen, **When** the user creates a new task with
   title and duration, **Then** it appears in the list and is persisted via
   the API.
3. **Given** a task in "pending" status, **When** the user taps to start it,
   **Then** its status changes to "ongoing" and the UI updates immediately.
4. **Given** an ongoing task, **When** the user taps to complete it,
   **Then** its status changes to "done".

---

### User Story 5 — Minimal web client displays tasks (Priority: P5)

A minimal React + TypeScript web app consumes `api-client` to display the
user's tasks for today. This is NOT the final web app — it exists to validate
that the shared packages work from a web context too.

**Why this priority**: Lowest priority because the web is secondary. But it
validates that `api-client` and `core` types work in a browser/React context.

**Independent Test**: Open the web app in a browser, see today's tasks listed.

**Acceptance Scenarios**:

1. **Given** the web app is running and the API is available, **When** the
   user navigates to the app, **Then** a login form is displayed.
2. **Given** a valid auth token, **When** the task list loads, **Then** today's
   tasks are displayed using data from `api-client`.

---

### Edge Cases

- What happens when MongoDB is unreachable? → API returns 503; mobile/web show
  an error message. Domain interactors throw, adapters catch and map to HTTP status.
- What happens when a package has a circular dependency? → Turborepo build fails
  with a clear error. The dependency flow is enforced by package.json references.
- What happens when NativeScript can't resolve a shared package? → Build fails.
  The `nativescript.config.ts` must explicitly map workspace packages.
- What happens when the JWT secret is missing from env? → API fails to start with
  a clear validation error at startup, not at first request.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Monorepo MUST build all packages in dependency order via `pnpm build` from root.
- **FR-002**: `@dayparty/core` MUST export all shared types: Task, TaskStatus, User, UserRole, Entity, AuthSession, AuthToken, TagOption, CookieName, EmailMessage, EmailSendInput, and the Interactor interface.
- **FR-003**: `@dayparty/domain` MUST export business logic (auth session create/verify/delete, user find/create, task CRUD) as functions that receive repository/service dependencies as parameters.
- **FR-004**: `@dayparty/domain` MUST define repository interfaces (AuthSessionRepo, UserRepo, TaskRepo) and service interfaces (AuthTokenService, EmailService).
- **FR-005**: `@dayparty/db` MUST provide MongoDB implementations of all repository interfaces from domain.
- **FR-006**: `@dayparty/validation` MUST export Zod schemas for task creation/update and auth email input, usable by API, web, and mobile.
- **FR-007**: `@dayparty/api-client` MUST provide a typed HTTP client using native `fetch` with methods for auth (login, verify, logout) and tasks (list, create, update, delete).
- **FR-008**: The Hono API MUST expose REST endpoints equivalent to every existing server action, protected by JWT middleware where required.
- **FR-009**: The NativeScript app MUST launch on iOS and Android with frame-based native navigation.
- **FR-010**: The NativeScript app MUST implement login, task list (rundown), and active task (ongoing) screens.
- **FR-011**: The existing web app MUST be preserved as-is in `apps/web-legacy/` for reference.
- **FR-012**: A minimal React + TypeScript web client MUST exist in `apps/web/` consuming `api-client`.
- **FR-013**: Turborepo MUST be configured with `build`, `dev`, and `clean` pipelines.

### Key Entities

- **Task**: The core domain object. Has title, size, duration, elapsed time, status (pending/ongoing/paused/done), scheduledAt date, tags, ordering, and ownership by user. Represents a time-boxed action item in a user's day.
- **User**: A person using day.party. Has email, username, and role (admin/premium/standard). Identified by a unique ID.
- **AuthSession**: A temporary record created during magic-link login flow. Links an email to a session ID. Becomes active after verification and is consumed once.
- **AuthToken**: A JWT payload containing session ID, email, user ID, and role. Used for authenticating API requests.
- **TagOption**: A label+color pair for categorizing tasks (work, home, personal, study, or custom).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `pnpm install && pnpm build` from a fresh clone completes without errors in under 60 seconds.
- **SC-002**: All five packages (`core`, `domain`, `db`, `validation`, `api-client`) produce `dist/` with correct `.d.ts` type declarations.
- **SC-003**: The Hono API starts and responds to health check within 2 seconds.
- **SC-004**: The full auth flow (send login → verify session → receive JWT → fetch tasks) works end-to-end via curl/HTTP client.
- **SC-005**: `ns run ios` from `apps/mobile/` launches the app on an iOS simulator showing the login screen.
- **SC-006**: The minimal web client renders today's tasks when pointed at the running API.
- **SC-007**: No package in `packages/` imports from any package in `apps/`. Dependency direction is enforced.

## Assumptions

- MongoDB 6 is available locally via the existing `docker-compose.yml` setup (user: dayparty, password: partyday, port 27017, database: dayparty).
- Environment variables (`MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRATION_TIME_SECS`, `EMAIL_RESEND_API_KEY` or dev mode) will be configured via `.env` files in the relevant apps.
- NativeScript 9 CLI and platform tools (Xcode for iOS, Android SDK for Android) are already installed on the developer machine.
- The existing web app's functionality is well-understood from the prior codebase analysis and `docs/PROJECT_CONTEXT.md`.
- The `FakeEmailService` (console logging) is sufficient for development; Resend integration is a production concern.
- Deep links for magic-link auth on mobile are out of scope — the MVP uses manual session ID entry or web-based verification.
