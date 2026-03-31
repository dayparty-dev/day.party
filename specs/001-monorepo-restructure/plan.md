# Implementation Plan: Monorepo Restructure + API + Mobile Scaffold

**Branch**: `001-monorepo-restructure` | **Date**: 2026-03-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-monorepo-restructure/spec.md`

## Summary

Restructure day.party from a monolithic Next.js app into a Turborepo + pnpm workspaces
monorepo. Extract shared TypeScript packages (`core`, `domain`, `db`, `validation`,
`api-client`), create a Hono REST API, scaffold a NativeScript 9 mobile app (login +
rundown + ongoing), preserve the existing web app as legacy reference, and add a minimal
React + TS web client. Architecture follows cuakl's Tidy Architecture (core/adapters/config)
and Pod Pattern conventions.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode goal, incremental)
**Primary Dependencies**: Turborepo, pnpm 10, Hono, NativeScript 9, React 19, Zod, mongodb driver
**Storage**: MongoDB 6 (existing docker-compose setup)
**Testing**: Deferred — integration tests prioritized when added; vitest preferred
**Target Platform**: Web (browsers), Node/Bun (API), iOS 15+ / Android 10+ (mobile)
**Project Type**: Monorepo (5 packages + 4 apps)
**Performance Goals**: API health check <2s, monorepo build <60s
**Constraints**: Shared packages must have zero UI deps; dependency flow must be unidirectional
**Scale/Scope**: 2-3 devs, ~5 screens mobile, ~12 API endpoints, 5 shared packages

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                    | Status  | Notes                                                                                               |
| ---------------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| I. Simplicity-First          | ✅ PASS | 5 packages is the minimum needed. No extra abstractions.                                            |
| II. TypeScript Everywhere    | ✅ PASS | All code is TypeScript. Packages export `.d.ts`.                                                    |
| III. Tidy Architecture + Pod | ✅ PASS | core=models, domain=logic+interfaces, db=adapter, validation=contracts, api-client=consumer adapter |
| IV. Shared Core, Platform UI | ✅ PASS | packages/ has zero UI deps. apps/ own all UI.                                                       |
| V. Mobile-Native Fidelity    | ✅ PASS | NativeScript TypeScript puro, frame-based nav, platform-specific UI                                 |
| VI. Pragmatic Quality        | ✅ PASS | No tests required in prototype phase. Validation at boundaries only.                                |

**Complexity justification:**

| Item                            | Why Needed                                                                  | Simpler Alternative Rejected Because                                            |
| ------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Repository interfaces in domain | Enable same interactors for API + tests + future DB swap                    | Direct MongoDB imports would couple domain to adapter                           |
| 5 packages (not 3)              | `validation` and `api-client` have distinct consumers and dependency graphs | Merging into core/domain would add unwanted deps (zod in core, fetch in domain) |

## Project Structure

### Documentation (this feature)

```text
specs/001-monorepo-restructure/
├── plan.md              # This file
├── research.md          # Phase 0: tech research and decision log
├── data-model.md        # Phase 1: entity models and relationships
├── quickstart.md        # Phase 1: getting started guide
├── contracts/           # Phase 1: API and package contracts
│   ├── api-routes.md
│   ├── packages.md
│   └── mobile-screens.md
└── tasks.md             # Phase 2: task breakdown (speckit.tasks)
```

### Source Code (repository root)

```text
day.party/
├── package.json                  # Root workspace scripts (turbo build/dev/clean)
├── pnpm-workspace.yaml           # Workspace: packages/*, apps/*
├── turbo.json                    # Turborepo pipeline config
├── .npmrc                        # shamefully-hoist=true (NativeScript compat)
├── docker-compose.yml            # MongoDB (existing, stays at root)
│
├── packages/
│   ├── core/                     # @dayparty/core — types, models, constants
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── models/           # Task, User, Entity, AuthSession, AuthToken, TagOption
│   │       ├── auth/             # AuthToken*, AuthSession types
│   │       ├── email/            # EmailMessage, EmailSendInput
│   │       ├── constants/        # CookieName
│   │       └── patterns/         # Interactor<I,O>
│   │
│   ├── domain/                   # @dayparty/domain — business logic, repo/service interfaces
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── repos/            # AuthSessionRepo, UserRepo, TaskRepo interfaces
│   │       ├── services/         # AuthTokenService, EmailService, UserService interfaces
│   │       ├── interactors/      # CreateAuthSession, VerifyAuthSession, etc.
│   │       └── utils/            # groupTasksByDate, sorting
│   │
│   ├── db/                       # @dayparty/db — MongoDB repo implementations
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── connection.ts     # MongoDB singleton
│   │       └── repos/            # MongoAuthSessionRepo, MongoUserRepo, MongoTaskRepo
│   │
│   ├── validation/               # @dayparty/validation — Zod schemas
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── task.ts           # taskCreateSchema, taskUpdateSchema
│   │       └── auth.ts           # loginEmailSchema
│   │
│   └── api-client/               # @dayparty/api-client — typed fetch HTTP client
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── client.ts         # Base fetch wrapper with JWT auth header
│           ├── auth.ts           # login, verify, logout
│           ├── tasks.ts          # list, create, update, delete, sync
│           └── types.ts          # ApiResponse<T>, ApiError
│
├── apps/
│   ├── api/                      # Hono REST API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts          # Hono app entry, serve()
│   │       ├── routes/
│   │       │   ├── auth.ts       # POST /login, /verify, /logout
│   │       │   ├── tasks.ts      # GET/POST/PATCH/DELETE /tasks
│   │       │   └── admin.ts      # GET /admin/users, PATCH role, POST auth-as
│   │       ├── middleware/
│   │       │   └── auth.ts       # JWT verification middleware
│   │       └── services/         # Concrete implementations: JWT, Email, User
│   │
│   ├── mobile/                   # NativeScript 9 app
│   │   ├── package.json
│   │   ├── nativescript.config.ts
│   │   ├── vite.config.ts
│   │   ├── references.d.ts
│   │   └── src/
│   │       ├── app.ts            # Application.run()
│   │       ├── app-root.xml      # Root Frame
│   │       ├── views/
│   │       │   ├── login/        # login-page.xml + login-page.ts
│   │       │   ├── rundown/      # rundown-page.xml + rundown-page.ts
│   │       │   └── ongoing/      # ongoing-page.xml + ongoing-page.ts
│   │       ├── services/         # auth-service.ts, task-service.ts
│   │       └── utils/            # navigation.ts
│   │
│   ├── web/                      # Minimal React + TS client (NEW)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       └── pages/            # Login, TaskList
│   │
│   └── web-legacy/               # Existing Next.js app (moved from root)
│       ├── package.json
│       ├── next.config.js
│       ├── app/                  # All existing app/ code
│       ├── lib/                  # Existing lib/ (for reference only)
│       └── public/
│
└── docs/                         # Existing docs (stays at root)
```

**Structure Decision**: Turborepo monorepo with `packages/` (5 shared libraries) and
`apps/` (4 deployable applications). This maps directly to the constitution's Tidy
Architecture: `core` + `domain` = Pod core, `db` = Pod adapter, `validation` = shared
contracts, `api-client` = consumer adapter. Each app is platform-specific UI.
