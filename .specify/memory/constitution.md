<!--
Sync Impact Report
- Version change: 1.1.0 → 2.0.0 (MAJOR: fundamental context change)
- Added cuakl ecosystem context: day.party is part of a product studio, not standalone
- Adopted Tidy Architecture as the guiding architectural philosophy
- Adopted Pod Pattern as the organizational unit for shared packages
- Changed "solo developer" to "small team (2-3 people)"
- Added principle: Tidy Architecture + Pod Pattern
- Renamed/merged Dependency Injection principle into Tidy Architecture principle
- Added Architecture Constraints: Pod alignment, auth-pod adoption path, ecosystem awareness
- Added Ecosystem Context section
- Follow-up TODOs: none
-->

# day.party Constitution

## Ecosystem Context

day.party is a product within the **cuakl** ecosystem — a software product studio
focused on delivering useful software fast without sacrificing UX or maintainability.

**Relevant cuakl context:**

- **Tidy Architecture**: cuakl's architectural philosophy. Simple core, clear adapters,
  evolve when needed. See `docs/broader_context/003-tidy-architecture-manifesto.md`.
- **Pod Pattern**: cuakl's organizational unit for reusable domain modules. Self-contained,
  framework-agnostic cores with thin adapters and config. Pods can move between projects.
- **auth-pod**: An existing cuakl auth service (JWT, RBAC, refresh tokens, password reset)
  that day.party may adopt to replace its current custom auth.
- **ágora**: A future companion product (emotional journaling) that will integrate with
  day.party (ágora = emotional core, day.party = action/tasks layer).
- **qweek/great.day**: Other products in the ecosystem that may share pods with day.party.

Shared packages in this monorepo SHOULD be designed with Pod conventions in mind
so they can eventually be extracted and reused across the cuakl ecosystem.

## Core Principles

### I. Simplicity-First

This is a small team (2-3 people) building multiple products. Every decision
MUST favor simplicity and maintainability over scalability or abstraction elegance.

- Do not add features, layers, or abstractions beyond what is directly needed.
- YAGNI applies universally. If in doubt, leave it out.
- Prefer fewer files with clear intent over many small files for organization's sake.
- Start simple, evolve gradually. Add complexity only when the pain of not having
  it becomes real.

### II. TypeScript Everywhere

All code — packages, web, API, mobile — MUST be written in TypeScript.

- Strict mode is the goal but not a blocker; migrate incrementally.
- Shared packages MUST export proper type declarations.
- No `any` in shared packages. `any` is tolerated temporarily in app-level code
  during active migration only.

### III. Tidy Architecture + Pod Pattern

Follow cuakl's Tidy Architecture principles and Pod Pattern for code organization:

- **Core**: Pure business logic, domain models, framework-agnostic. Zero platform deps.
- **Adapters**: Framework-specific implementations (Hono routes, React components,
  NativeScript views). Thin wrappers that call core logic.
- **Config**: Typed configuration interfaces, dependency injection via constructor params.

Domain logic (actions, interactors) MUST receive their dependencies (repositories,
services) as parameters — never import platform-specific implementations directly.
This enables the same logic to run in a Hono API route, a test harness, or any
future framework without modification.

Packages in `packages/` follow Pod conventions:

- `core/` = types, models, constants (the "models" part of a pod)
- `domain/` = business logic, repository interfaces, service interfaces (the "core" of pods)
- `db/` = MongoDB implementations of repository interfaces (an "adapter")
- `validation/` = Zod schemas (shared contract validation)
- `api-client/` = typed HTTP client (a consumer-side adapter)

### IV. Shared Core, Platform-Specific UI

Business logic, types, validation, and API communication MUST live in shared
packages consumable by web, API, and mobile.

- UI is NEVER shared between web and mobile. Each platform owns its UI entirely.
- Shared packages MUST have zero UI framework dependencies (no React, no NativeScript UI).
- The boundary is clear: `packages/` = portable TypeScript; `apps/` = platform-specific.

### V. Mobile-Native Fidelity

The NativeScript mobile app MUST feel native on each platform.

- iOS: Follow Apple HIG — native navigation, SF typography, blur, sheets.
- Android: Follow Material 3 — edge-to-edge, predictive back, Material You theming.
- It is acceptable (and encouraged) that iOS and Android UI differ when it
  serves platform fidelity.
- Use NativeScript's direct access to native APIs from TypeScript
  whenever it produces a better UX than a cross-platform abstraction.

### VI. Pragmatic Quality

- Code that ships and works beats perfect code that doesn't.
- Validate inputs at system boundaries (API routes, form submissions).
  Internal functions trust their callers.
- Add error handling only for scenarios that can actually occur.
- Tests are welcome but not gate-blocking in the prototype phase.
  Prioritize integration tests over unit tests when both are an option.

## Technology Stack

| Layer          | Technology                            | Notes                                                  |
| -------------- | ------------------------------------- | ------------------------------------------------------ |
| Monorepo       | Turborepo + pnpm workspaces           | Simple, fast, TypeScript-native                        |
| Web            | React + TypeScript                    | Framework/styling/architecture TBD. Minimal client now |
| API            | Hono on Node/Bun                      | Lightweight, TypeScript-first, edge-ready              |
| Mobile         | NativeScript 9, TypeScript puro, Vite | Direct native API access, no UI framework              |
| Database       | MongoDB 6 (existing)                  | PostgreSQL + Drizzle planned for later                 |
| Auth           | JWT magic-link (existing, custom)     | cuakl auth-pod adoption planned for later              |
| Validation     | Zod                                   | Schemas shared across all consumers                    |
| Package builds | tsc (for packages)                    | Simple, no custom bundler config in packages           |

## Architecture Constraints

- **Monorepo structure**: `packages/` for shared libraries, `apps/` for deployables.
- **Package dependency flow**: `core` ← `domain` ← `db`, `validation`, `api-client`.
  No circular dependencies. Packages MUST NOT depend on apps.
- **Pod alignment**: Packages SHOULD follow cuakl Pod conventions (core/adapters/config)
  so they can be extracted to standalone pods for the broader cuakl ecosystem later.
  This is a design goal, not a blocker — don't over-abstract to force Pod shape.
- **Existing web app** moves to `apps/web-legacy/` as reference only. It is NOT
  the base for the new web client. It serves to understand existing features and
  data flows during extraction of shared packages.
- **New web client** (`apps/web/`) will be a minimal React + TypeScript app that
  consumes `api-client` for basic feature testing. Final web architecture (framework,
  routing, styling, SSR vs SPA) is intentionally deferred.
- **Auth strategy**: Current custom JWT magic-link auth extracted to shared packages
  for now. Adoption of cuakl's auth-pod (which has JWT, RBAC, refresh tokens, etc.)
  is planned as a future step once the monorepo structure is stable.
- **No Zustand in mobile**. NativeScript with TypeScript puro uses singleton
  services for state management — more natural in that context.
- **i18n**: Spanish only in mobile MVP. Web i18n approach TBD with final web stack.
- The legacy web app MAY break during restructuring. Structure correctness is the priority.

## Development Workflow

- Small team (2-3 people). Lightweight process. PRs optional for review, not mandatory.
- Use Spec-Driven Development (this toolkit) for complex multi-step features.
- Spec artifacts live in `.specify/` and serve as living documentation.
- When a spec is complete and implemented, its artifacts remain as a record.
- Shared packages should be designed so they could eventually live outside this
  monorepo as standalone cuakl pods — but don't prematurely extract.

## Governance

- This constitution governs all development decisions for day.party.
- Amendments MUST be documented with version bump and rationale.
- When a principle conflicts with shipping working software, the principle
  yields — but the conflict MUST be noted for future resolution.

**Version**: 2.0.0 | **Ratified**: 2026-03-31 | **Last Amended**: 2026-03-31
