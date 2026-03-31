# Feature Specification: Monorepo Restructure

**Feature Branch**: `001-monorepo-restructure`
**Created**: 2026-03-31
**Status**: Draft
**Input**: User description: "Restructure day.party from monolithic Next.js into a Turborepo + pnpm monorepo with shared TypeScript packages (core, domain, db, validation, api-client), a Hono REST API, a NativeScript 9 mobile app (login + rundown + ongoing screens), and a minimal React web client. Preserve existing app as a legacy, vague reference only (already moved to /app/web-legacy). Do your own thinking and let the constitution guide you, NOT the existing code."

## Clarifications

### Session 2026-03-31

- Q: How do auth tokens travel between client and API (cookies, bearer, hybrid)? → A: Bearer tokens via `Authorization` header; each client stores tokens using platform-appropriate secure storage.
- Q: What unit/scale does Task size use (minutes, relative, t-shirt)? → A: Unitless relative scale (1–5) representing effort magnitude; no time conversion; day capacity is sum of sizes.
- Q: What structured error shape should the API return? → A: Proper HTTP status codes plus a body with `code` (machine-readable string), `message` (human-readable), and optional `fields` map for validation errors.
- Q: Are tags user-scoped, system-provided, or both? → A: System-provided defaults plus user-created custom tags; new users get a starter set they can edit/delete.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Unified Workspace for Multi-Platform Development (Priority: P1)

A developer opens the day.party project and can build, test, and lint all shared packages and applications from a single workspace. Shared business logic (task management rules, validation, domain models) lives in dedicated packages that each application consumes — rather than being duplicated or owned by any single app. When a developer changes a shared rule (e.g., how task priorities are calculated), every consuming app picks up the change automatically without manual synchronization.

**Why this priority**: Without a working monorepo foundation and shared packages, no other story is possible. This is the structural prerequisite that unblocks mobile, web, and API work in parallel.

**Independent Test**: A developer can clone the repository, install dependencies with a single command, and successfully build all packages and applications. A change to a shared package triggers rebuilds only in the affected downstream apps.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repository, **When** a developer runs the install command, **Then** all workspace packages and apps resolve their dependencies and are ready to build.
2. **Given** the monorepo is set up, **When** a developer runs the build command from the root, **Then** all packages build in the correct dependency order and all apps compile successfully.
3. **Given** a shared domain package, **When** a developer modifies a type definition, **Then** consuming apps that reference that type show errors or pass builds accordingly, without manual intervention.
4. **Given** the monorepo workspace, **When** a developer runs the test command from the root, **Then** tests across all packages and apps execute and report results in a unified output.

---

### User Story 2 - REST API Serving All Clients (Priority: P2)

A client application (web or mobile) communicates with a single REST API to authenticate users and manage tasks. The API exposes consistent endpoints for login, task CRUD, task reordering, and day navigation. The API uses the same shared domain models and validation rules as the clients, ensuring data contracts are never out of sync. Any new client (future platforms, third-party integrations) can consume the same API without backend changes.

**Why this priority**: The API is the backbone that both mobile and web clients depend on. Without it, neither client can function. It also enforces the separation between frontend and backend that the current monolith lacks.

**Independent Test**: The API can be started independently and exercised via any HTTP client. A developer can authenticate, create tasks, retrieve a day's rundown, and verify responses match the shared validation schemas.

**Acceptance Scenarios**:

1. **Given** the API is running, **When** a client sends a valid authentication request, **Then** the API returns a session token and the user's identity.
2. **Given** an authenticated session, **When** a client requests the task rundown for a specific day, **Then** the API returns the ordered list of tasks with their sizes, tags, and completion states.
3. **Given** an authenticated session, **When** a client creates, updates, reorders, or deletes a task, **Then** the API persists the change and returns the updated state.
4. **Given** a request with invalid data, **When** the API validates it against the shared validation schemas, **Then** the API returns a structured error response with specific field-level details.
5. **Given** the API and the shared validation package, **When** a validation rule changes in the shared package, **Then** both API and clients enforce the same updated rule.

---

### User Story 3 - Mobile App with Core Task Experience (Priority: P3)

A user opens the day.party mobile app on their phone, logs in, and sees their task rundown for the day — the same data and rules they would see on the web. They can browse their daily schedule, mark tasks as complete, and switch to an "ongoing" focused view for the current task with a time indicator. The mobile experience feels native and responsive, not like a wrapped website.

**Why this priority**: Mobile is where neurospicy users live — quick glances, frequent context switches, on-the-go task checks. A native mobile experience is critical to the product vision of meeting users where they are. It depends on the API (P2) being available.

**Independent Test**: A user can install the mobile app on a device or emulator, log in with their credentials, see their rundown, and complete a task — all without needing the web client.

**Acceptance Scenarios**:

1. **Given** the mobile app is installed, **When** a user opens it for the first time, **Then** they see a login screen and can authenticate.
2. **Given** a logged-in user, **When** they navigate to the rundown screen, **Then** they see their tasks for today ordered by schedule, with size and tag indicators.
3. **Given** the rundown screen, **When** a user taps a task to mark it complete, **Then** the task state updates and the rundown reflects the change immediately.
4. **Given** the rundown screen, **When** a user navigates to the ongoing view, **Then** they see the current or next task with a time/progress indicator and can focus on it.
5. **Given** an active session, **When** the user's token expires, **Then** the app prompts re-authentication without losing context of what they were viewing.

---

### User Story 4 - Web Client with Core Task Experience (Priority: P4)

A user opens the day.party web app in their browser, logs in, and accesses the same rundown and ongoing views available on mobile. The web client is lightweight and focused — it provides the core task management experience without carrying the weight of the legacy app's accumulated complexity. It consumes the same API and shared packages as the mobile app.

**Why this priority**: The web client ensures feature parity for users who prefer desktop/browser access. It validates the shared-package architecture by proving a second frontend can be built on the same foundation with minimal duplication. It depends on the API (P2) being available.

**Independent Test**: A user can open the web app in a browser, log in, view their rundown, and complete a task — all without needing the mobile app.

**Acceptance Scenarios**:

1. **Given** the web app is loaded, **When** a user visits it unauthenticated, **Then** they see a login screen and can authenticate.
2. **Given** a logged-in user, **When** they navigate to the rundown view, **Then** they see their tasks for the day matching what the API returns.
3. **Given** the rundown view, **When** a user marks a task complete, **Then** the state updates and the UI reflects the change without a full page reload.
4. **Given** the web app, **When** a user navigates to the ongoing view, **Then** they see the current or next task with a time/progress indicator.

---

### User Story 5 - Legacy App Preserved as Reference (Priority: P5)

The existing Next.js application remains available in the workspace as a read-only reference for developers. It continues to run independently for any users still relying on it during the transition, but receives no new features. Developers can consult its code to understand existing behavior, flows, and edge cases while building the new apps.

**Why this priority**: Preserving the legacy app de-risks the restructure. It provides a safety net during migration and a reference for how existing features work. It's already done (moved to apps/web-legacy) so the cost is near-zero.

**Independent Test**: A developer can navigate to the legacy app directory and start it independently. It boots and behaves as it did before the restructure.

**Acceptance Scenarios**:

1. **Given** the monorepo workspace, **When** a developer navigates to the legacy app, **Then** they can install its dependencies and start it independently.
2. **Given** the legacy app is running, **When** a user visits it, **Then** it behaves identically to how it did before the restructure.
3. **Given** ongoing development on new apps, **When** shared packages are modified, **Then** the legacy app is unaffected (it does not consume the new shared packages).

---

### Edge Cases

- What happens when the API is unreachable from the mobile or web client? The client must show a clear offline/error state and retry gracefully, not crash or show a blank screen.
- What happens when shared validation schemas reject data that the legacy app previously accepted? The API must return descriptive validation errors so developers can identify and reconcile the discrepancy.
- What happens when a developer adds a new shared package? The workspace must support adding new packages without modifying build configuration in every existing app.
- What happens when the mobile app is backgrounded during an active ongoing session? The app must restore state when resumed, not reset to the login screen.
- How does the system handle concurrent edits from web and mobile (same user, two devices)? The API is the source of truth; last-write-wins is acceptable for v1, with conflicts surfaced to the user if detectable.

## Requirements _(mandatory)_

### Functional Requirements

**Monorepo & Shared Packages**

- **FR-001**: The workspace MUST be organized as a monorepo with distinct workspace areas for shared packages and applications.
- **FR-002**: Shared packages MUST include: domain models and types, business logic and rules (core), database access abstractions, input validation schemas, and a typed API client.
- **FR-003**: Each shared package MUST be independently buildable and testable.
- **FR-004**: Applications MUST consume shared packages as workspace dependencies, not via copy-paste or git submodules.
- **FR-005**: A single root-level command MUST build all packages in correct dependency order.
- **FR-006**: A single root-level command MUST run all tests across the workspace.
- **FR-007**: A single root-level command MUST run linting across the workspace.

**REST API**

- **FR-008**: The API MUST expose RESTful endpoints for user authentication (login, logout, session validation).
- **FR-009**: The API MUST expose RESTful endpoints for task CRUD (create, read, update, delete).
- **FR-010**: The API MUST expose an endpoint to retrieve a user's task rundown for a given day (ordered task list with metadata).
- **FR-011**: The API MUST expose an endpoint to reorder tasks within a day.
- **FR-012**: The API MUST validate all incoming requests using the shared validation package and return structured error responses: proper HTTP status codes (400, 401, 404, 422, etc.) with a body containing a machine-readable `code`, a human-readable `message`, and an optional `fields` map with per-field validation details.
- **FR-013**: The API MUST authenticate requests using bearer tokens sent in the `Authorization` header and reject unauthorized access to protected endpoints.
- **FR-014**: The API MUST use the shared database access package to persist and retrieve data.

**Mobile App**

- **FR-015**: The mobile app MUST provide a login screen where users can authenticate.
- **FR-016**: The mobile app MUST provide a rundown screen showing the user's tasks for the current day, ordered by schedule.
- **FR-017**: The mobile app MUST allow users to mark tasks as complete from the rundown screen.
- **FR-018**: The mobile app MUST provide an ongoing screen showing the current or next task with a time/progress indicator.
- **FR-019**: The mobile app MUST use the shared API client package to communicate with the REST API.
- **FR-020**: The mobile app MUST handle authentication token expiration by prompting the user to re-login.
- **FR-020a**: Each client MUST store bearer tokens using platform-appropriate secure storage (e.g., OS keychain on mobile, httpOnly cookie or secure in-memory store on web).

**Web Client**

- **FR-021**: The web client MUST provide a login view where users can authenticate.
- **FR-022**: The web client MUST provide a rundown view showing the user's tasks for the current day.
- **FR-023**: The web client MUST allow users to mark tasks as complete from the rundown view.
- **FR-024**: The web client MUST provide an ongoing view showing the current or next task with a time/progress indicator.
- **FR-025**: The web client MUST use the shared API client package to communicate with the REST API.

**Legacy Preservation**

- **FR-026**: The legacy Next.js app MUST remain in the workspace as-is, bootable independently.
- **FR-027**: The legacy app MUST NOT be modified as part of this restructure (no new dependencies on shared packages).

### Key Entities

- **Task**: The core unit of work. Has a title, size (unitless relative effort on a 1–5 scale), optional tag, completion state, scheduled date, and position within a day's ordering. Belongs to a user.
- **User**: A person who uses day.party. Has an identity (email), authentication credentials/sessions, and owns a collection of tasks.
- **Session**: Represents an authenticated user's active login. Has an associated token, expiration, and a link to the user.
- **Tag**: A categorization label for tasks (e.g., "work", "health", "hobby"). Has a key, display name, and optional color/icon. A set of system-provided default tags is seeded for new users (editable and deletable); users can also create custom tags. Tags are scoped to the owning user.
- **Day Rundown**: A derived view of a user's tasks for a specific date, ordered by the user's preferred sequence. Day capacity is the sum of task sizes (unitless). Not stored directly — computed from tasks filtered by date and sorted by position.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A developer can clone the repo, install dependencies, and successfully build all packages and apps with a single command in under 5 minutes on a standard machine.
- **SC-002**: A change to a shared domain model is reflected in all consuming apps after a single build cycle — zero manual synchronization steps.
- **SC-003**: The API responds to authenticated task CRUD requests in under 500ms at low load (single user).
- **SC-004**: A user can complete the login → view rundown → mark task complete flow on both mobile and web in under 30 seconds.
- **SC-005**: The mobile and web clients achieve functional parity for the three core screens (login, rundown, ongoing) — any action available on one is available on the other.
- **SC-006**: The legacy app boots and functions identically to its pre-restructure state with zero modifications.
- **SC-007**: Adding a new shared package to the workspace requires modifying only the new package's own configuration — zero changes to existing apps or packages.
- **SC-008**: All shared packages have passing test suites that can be run in isolation or as part of the workspace-wide test command.

## Assumptions

- Users have internet connectivity when using the mobile or web client; offline support is out of scope for this restructure.
- The existing magic-link/JWT authentication pattern will carry forward to the new API and clients — no change to auth method. Tokens are transported as bearer tokens in the `Authorization` header; each platform manages secure storage independently.
- MongoDB remains the database; the shared database package abstracts access but does not change the underlying store.
- The mobile app targets iOS and Android via a shared codebase; platform-specific native modules are out of scope for v1.
- The web client is minimal — it covers login, rundown, and ongoing views only. Advanced features (admin panel, drag-and-drop reordering, calendar views, PiP) are deferred to future iterations.
- The rewards/gamification system is out of scope for this restructure; it will be added as a future feature on top of the new architecture.
- The legacy app's existing data (MongoDB collections, user accounts, tasks) is reused directly by the new API and clients — no data migration is required.
- The NativeScript mobile app communicates exclusively via the REST API; it does not access the database directly.
- New users are provisioned with a default set of tags (e.g., work, health, hobby, errands) that they can rename, delete, or extend with custom tags.
- The Tidy Architecture Pod pattern guides package boundaries: framework-agnostic core, thin adapters per platform, and simple constructor-based dependency injection.
