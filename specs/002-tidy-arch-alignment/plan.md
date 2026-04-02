# Implementation Plan: Tidy architecture alignment

**Branch**: `002-tidy-arch-alignment` | **Date**: 2026-04-02 | **Spec**: [`spec.md`](./spec.md)

**Input**: Feature specification from `/Users/santi/dev/day.party/specs/002-tidy-arch-alignment/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Align the monorepo’s **new stack** (`packages/*`, `apps/api`, `apps/web`, `apps/mobile`) with Tidy Architecture and the cuakl Pod mental model: **clear core vs adapter vs infrastructure**, **ports for persistence**, **explicit composition at entrypoints**, and **validation at the edge**—without copying reference boilerplate (no unused `BaseAction` / `BaseRequestHandler` unless they earn their keep). Normative structure reference: `docs/broader_context/004-tidy-architecture-reference.md`; principles: `docs/broader_context/003-tidy-architecture-manifesto.md`. On conflict, **project constitution** (`/.specify/memory/constitution.md`) wins; implementation stays **spec-driven** (legacy is not a blueprint).

Deliverables are **incremental by domain slice**: document the monorepo↔reference mapping (FR-001), tighten **API composition typing** so `ApiEnv` depends on **domain repository ports** rather than concrete Mongo classes (closes the gap called out for FR-002/FR-003), keep **wiring in one obvious place** (`apps/api` entry / small composition helper—see research), add **core-level tests** where slices are touched, and apply the **architecture checklist** per slice (SC-002, SC-003).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode incremental)  
**Primary Dependencies**: Turborepo, pnpm 10, Hono (`apps/api`), React 19 + Vite (`apps/web`), NativeScript 9 (`apps/mobile`), Zod (`@dayparty/validation`), MongoDB driver (`@dayparty/db`)  
**Storage**: MongoDB 6 (existing); access only via repository ports from domain, implementations in `@dayparty/db`  
**Testing**: Vitest (packages/apps as configured); taxonomy: fast **domain/core** tests (fakes/in-memory) vs **API integration** tests (Hono + optional test DB)—see `research.md`  
**Target Platform**: Node for API; browsers for web; iOS/Android for mobile  
**Project Type**: Turborepo monorepo — shared packages + multiple apps  
**Performance Goals**: N/A for this alignment feature (no new latency targets)  
**Constraints**: Simplicity-first (constitution); no new layers or unused abstractions; incremental shippable slices (FR-006); package dependency flow `core` ← `domain` ← `db` / `validation` / `api-client`; packages MUST NOT depend on apps  
**Scale/Scope**: Documentation + targeted refactors (e.g. `ApiEnv`, routes using ports), checklist and tests per agreed slices—not a monorepo-wide rewrite

### Reference concepts → this repository (FR-001)

| Reference (`auth-pod`-style)                                               | This monorepo                                                                                                                    | Role                     |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `pod/core` (actions, models, optional services, **repository interfaces**) | `@dayparty/core` (models, constants, shared types); `@dayparty/domain` (actions, **ports** / repository interfaces)              | Framework-agnostic core  |
| `pod/adapters` (HTTP handlers, framework glue)                             | `apps/api` (Hono routes, middleware, `createApp`); `apps/web`, `apps/mobile` (UI adapters)                                       | Transport / presentation |
| `pod/config` (typed config, DI)                                            | Env + explicit construction in `apps/api/src/index.ts` (and optional small `composition`/`env` module); app-level typed `ApiEnv` | Composition root         |
| `lib/` (Mongo implementations)                                             | `@dayparty/db` (Mongo repository classes implementing domain ports)                                                              | Infrastructure           |
| Validation at adapter edge (Zod in reference)                              | `@dayparty/validation` (Zod schemas); parse at route/boundary, domain receives validated shapes or performs domain-only rules    | Edge validation          |
| Consumer HTTP client                                                       | `@dayparty/api-client`                                                                                                           | Consumer-side adapter    |

**Verified current state**: `apps/api/src/index.ts` already constructs Mongo repos and passes `makeCreateTaskAction` (and siblings) into `createApp(env)` — **good explicit wiring**. **Gap**: `apps/api/src/types.ts` types `ApiEnv` with concrete `Mongo*` repository classes; routes (`tasks.ts`, `tags.ts`, `auth.ts`, `auth-middleware.ts`) use `env.taskRepo` / `env.userRepo` etc. Domain already defines `TaskRepository`, `UserRepository`, `SessionRepository`, `TagRepository` in `@dayparty/domain`; Mongo classes implement those interfaces. **Planned fix**: type `ApiEnv` with domain ports (and keep concrete instantiation only in `index.ts`).

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                             | Status                                                                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Simplicity-first**          | Pass — no mandatory new base classes; adopt reference _patterns_ (thin handlers, explicit DI) only.                                                               |
| **II. TypeScript**               | Pass — changes are typings and structure; avoid `any` in shared surfaces.                                                                                         |
| **III. Tidy + Pod**              | Pass — mapping reinforces core/domain vs db vs api adapters; aligns with constitution’s package roles.                                                            |
| **IV. Shared core, platform UI** | Pass — no UI in `packages/`; API remains thin adapter.                                                                                                            |
| **Package dependency flow**      | Pass — domain ports stay in `@dayparty/domain`; `@dayparty/db` implements them; apps wire concretes.                                                              |
| **Spec-driven implementation**   | Pass — work is driven by this spec/plan/contracts; legacy not used as blueprint.                                                                                  |
| **Pragmatic quality / tests**    | Pass — constitution allows prioritizing integration tests; spec SC-003 additionally asks for at least one core-level test per completed slice (both can coexist). |

### Post-design re-check (after Phase 1 artifacts)

All gates remain **Pass**. Artifacts (`research.md`, `data-model.md`, `quickstart.md`, `contracts/architecture-checklist.md`) encode the mapping, checklist, and testing taxonomy without introducing extra layers or conflicting with constitution.

## Project Structure

### Documentation (this feature)

```text
specs/002-tidy-arch-alignment/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1
│   └── architecture-checklist.md
├── checklists/
│   └── requirements.md
└── spec.md
```

### Source Code (repository root)

```text
/Users/santi/dev/day.party/
├── packages/
│   ├── core/                 # @dayparty/core — models, constants (pod “models”)
│   ├── domain/               # @dayparty/domain — actions, repository ports
│   ├── db/                   # @dayparty/db — Mongo adapters implementing ports
│   ├── validation/           # @dayparty/validation — Zod, edge validation
│   ├── api-client/           # @dayparty/api-client — typed REST consumer
│   ├── typescript-config/
│   └── eslint-config/
├── apps/
│   ├── api/                  # Hono: routes + middleware + createApp(env); composition root
│   ├── web/                  # React SPA adapter
│   ├── mobile/               # NativeScript adapter
│   └── web-legacy/           # reference only; not alignment target
├── docs/broader_context/     # manifesto + tidy reference (guardrails)
└── .specify/memory/constitution.md
```

**Structure Decision**: Boundaries match the constitution and FR-001: **core + domain logic** in `packages/core` and `packages/domain`, **persistence** in `packages/db`, **Zod** in `packages/validation`, **HTTP server adapter** in `apps/api`, **clients** in `packages/api-client`, **UIs** in `apps/web` and `apps/mobile`. The reference’s single `auth-pod/` tree is expressed as **multiple packages + apps**; the table above is the authoritative mapping.

## Complexity Tracking

> No constitution violations required for this feature; table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| —         | —          | —                                    |
