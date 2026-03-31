# Implementation Plan: Monorepo Restructure

**Branch**: `001-monorepo-restructure` | **Date**: 2026-03-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-monorepo-restructure/spec.md`

## Summary

Restructure day.party from a monolithic Next.js app into a Turborepo + pnpm monorepo with five shared TypeScript packages (core, domain, db, validation, api-client), a Hono REST API, a NativeScript 9 mobile app (login + rundown + ongoing screens), and a minimal React web client. The existing Next.js app is preserved as-is under `apps/web-legacy/` for reference. All new code is spec-driven — the legacy codebase is a vague reference only, per the constitution.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode goal, incremental migration)
**Primary Dependencies**: Turborepo, pnpm 10, Hono, NativeScript 9 + Vite, React 19, Zod, mongodb driver
**Storage**: MongoDB 6 (existing instance, no migration)
**Testing**: Vitest (workspace-wide; see [research.md](research.md) for rationale)
**Target Platform**: API: Node.js (Hono); Web: modern browsers (SPA); Mobile: iOS + Android (NativeScript)
**Project Type**: Monorepo — 5 shared packages + 3 apps (API, web, mobile) + 1 legacy app
**Performance Goals**: API <500ms for task CRUD at low load (SC-003); full login→rundown→complete flow <30s (SC-004)
**Constraints**: Online-only (no offline); Spanish-only mobile MVP; no Zustand in mobile; no `any` in shared packages
**Scale/Scope**: Small team (2–3 people); single-user prototype; 3 core screens (login, rundown, ongoing) per client

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| #   | Principle                         | Status   | Notes                                                                                                                                                   |
| --- | --------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I   | Simplicity-First                  | **PASS** | 5 packages + 3 apps is the minimum viable structure defined in the constitution itself. Each package has a single clear purpose. No extra abstractions. |
| II  | TypeScript Everywhere             | **PASS** | All packages and apps are TypeScript. Strict mode is goal, not blocker. No `any` in shared packages.                                                    |
| III | Tidy Architecture + Pod Pattern   | **PASS** | Package split follows Pod conventions: core=models, domain=logic+interfaces, db=adapter, validation=contract, api-client=consumer adapter.              |
| IV  | Shared Core, Platform-Specific UI | **PASS** | All shared packages have zero UI deps. Web and mobile each own their UI entirely. Clear boundary at packages/ vs apps/.                                 |
| V   | Mobile-Native Fidelity            | **PASS** | NativeScript 9 with TypeScript puro + Vite. Direct native API access. Platform-specific UI permitted.                                                   |
| VI  | Pragmatic Quality                 | **PASS** | Validation at system boundaries (API routes, form submit). Integration tests prioritized. Tests welcome but not gate-blocking in prototype.             |
| —   | Package Dependency Flow           | **PASS** | core ← domain ← {db, validation, api-client}. No circular deps. Packages never depend on apps.                                                          |
| —   | Spec-Driven Implementation        | **PASS** | All new code designed from spec/plan/contracts. Legacy is vague reference only.                                                                         |
| —   | No Zustand in Mobile              | **PASS** | NativeScript uses singleton services for state.                                                                                                         |
| —   | i18n: Spanish-Only Mobile MVP     | **PASS** | Noted as constraint. Web i18n deferred with final web stack.                                                                                            |

**Gate result: PASS** — no violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-monorepo-restructure/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/
├── core/                # Types, models, constants, enums
│   ├── src/
│   │   ├── models/      # Task, User, Session, Tag, DayRundown types
│   │   ├── constants/   # Default tags, size scale, error codes
│   │   └── index.ts     # Public API barrel
│   ├── package.json
│   └── tsconfig.json
├── domain/              # Business logic, repository & service interfaces
│   ├── src/
│   │   ├── actions/     # CreateTask, ToggleTaskCompletion, GetRundown, ReorderTasks, etc.
│   │   ├── interfaces/  # TaskRepository, UserRepository, SessionRepository, TagRepository
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── db/                  # MongoDB implementations of repository interfaces
│   ├── src/
│   │   ├── repositories/  # MongoTaskRepository, MongoUserRepository, etc.
│   │   ├── connection.ts  # MongoDB connection helpers
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── validation/          # Zod schemas shared across all consumers
│   ├── src/
│   │   ├── schemas/     # taskSchema, userSchema, sessionSchema, tagSchema
│   │   ├── errors.ts    # Structured error shape (code + message + fields)
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── api-client/          # Typed HTTP client for consuming the REST API
    ├── src/
    │   ├── client.ts    # DayPartyClient class (auth, tasks, rundown, tags)
    │   ├── types.ts     # Request/response types (re-exports from core where possible)
    │   └── index.ts
    ├── package.json
    └── tsconfig.json

apps/
├── api/                 # Hono REST API
│   ├── src/
│   │   ├── routes/      # auth.ts, tasks.ts, tags.ts
│   │   ├── middleware/  # auth-middleware.ts, error-handler.ts, validate.ts
│   │   ├── app.ts       # Hono app setup, route mounting
│   │   └── index.ts     # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── mobile/              # NativeScript 9 mobile app
│   ├── src/
│   │   ├── views/       # LoginView, RundownView, OngoingView
│   │   ├── services/    # Singleton state services (AuthState, TaskState)
│   │   ├── app.ts       # App bootstrap, navigation setup
│   │   └── app.css      # Global styles
│   ├── nativescript.config.ts
│   ├── package.json
│   └── tsconfig.json
├── web/                 # Minimal React web client
│   ├── src/
│   │   ├── pages/       # LoginPage, RundownPage, OngoingPage
│   │   ├── components/  # TaskCard, TimeIndicator, Layout
│   │   ├── hooks/       # useAuth, useTasks, useRundown
│   │   ├── App.tsx      # Router + layout
│   │   └── main.tsx     # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
└── web-legacy/          # Existing Next.js app (preserved as-is, read-only reference)
    └── [existing structure unchanged]
```

**Structure Decision**: Monorepo with `packages/` for 5 shared libraries and `apps/` for 4 apps (api, mobile, web, web-legacy). This follows the constitution's defined package split and Pod conventions. Each package has a single responsibility. Apps are thin adapters that compose shared packages with platform-specific UI and framework glue.

## Complexity Tracking

No constitution violations detected — table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _(none)_  | —          | —                                    |
