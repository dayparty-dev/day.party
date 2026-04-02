# Implementation Plan: Vision-aligned day planning rebuild

**Branch**: `003-vision-aligned-rebuild` | **Date**: 2026-04-02 | **Spec**: [`spec.md`](./spec.md)

**Input**: Feature specification from `/Users/santi/dev/day.party/specs/003-vision-aligned-rebuild/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Re-implement **flexible day planning** in the current monorepo stack so it matches the product vision in `docs/idea.md` and legacy next-steps in `docs/next-steps.md`, **without** treating `apps/web-legacy` as a blueprint (constitution: spec-driven). The codebase already has a minimal **Task** model (ordered items per calendar date, abstract `size` 1–5, rundown with summed `capacity`) and Hono REST routes. This feature **evolves** that core into spec **actionables** and **day plans**: real **fit/overflow** against a user-defined **daily window**, **priority / essentiality**, **triage and deferral**, **expanded notes**, **rewards and marketplace**, **visual presets**, and **audit history**—delivered in **priority slices** (P1→P6 in the spec) so each slice stays shippable and constitution-simple.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode incremental)  
**Primary Dependencies**: Turborepo, pnpm 10, Hono (`apps/api`), React 19 + Vite (`apps/web`), NativeScript 9 (`apps/mobile`), Zod (`@dayparty/validation`), MongoDB driver (`@dayparty/db`), `DayPartyClient` (`@dayparty/api-client`)  
**Storage**: MongoDB 6 (existing); new/extended documents and collections per `data-model.md`; access via **repository ports** in `@dayparty/domain`, implementations in `@dayparty/db`  
**Testing**: Vitest (packages/apps as configured); domain logic for fit/triage/rewards with **in-memory fakes**; API routes with **integration** tests where routes are added or changed  
**Target Platform**: Node for API; browsers for `apps/web`; iOS/Android for `apps/mobile`  
**Project Type**: Turborepo monorepo — shared packages + API + web + mobile  
**Performance Goals**: Responsive planning UI and rundown loads for “typical personal use” (spec edge cases: hundreds of actionables, thousands of history events); no hard numeric SLA in this plan  
**Constraints**: Tidy Architecture + Pod-style packages; **no UI in `packages/`**; validation at HTTP boundary; spec-driven (legacy reference only); **YAGNI** on gamification chrome (lootboxes, parody skins) until P1–P3 foundations exist  
**Scale/Scope**: Six prioritized user stories; multiple Mongo collections and REST surface evolution; **incremental** delivery by story, not a single big-bang

### Current baseline (verified)

- **Core model**: `Task` in `@dayparty/core` — `title`, `size` (1–5), `scheduledDate`, `position`, `isComplete`, optional `tagKey` ([`packages/core/src/models/task.ts`](../../packages/core/src/models/task.ts)).
- **Rundown**: `getRundown` sums `size` into `capacity` — **not** yet a time window or overflow split ([`packages/domain/src/actions/get-rundown.ts`](../../packages/domain/src/actions/get-rundown.ts)).
- **API**: `/api/tasks` CRUD + reorder ([`apps/api/src/routes/tasks.ts`](../../apps/api/src/routes/tasks.ts)); auth via existing JWT/magic-link stack.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                             | Status                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Simplicity-first**          | Pass — implement **by spec priority** (P1 first); avoid new abstraction layers until a slice needs them; defer physical integrations and social scope (explicitly out of spec). |
| **II. TypeScript**               | Pass — extend shared types in `@dayparty/core` / validation; avoid `any` on new public surfaces.                                                                                |
| **III. Tidy + Pod**              | Pass — new persistence behind **ports**; Hono/React/NativeScript remain thin adapters; wiring in `apps/api` composition root.                                                   |
| **IV. Shared core, platform UI** | Pass — fit/overflow **can be computed in domain** for consistency; **presentation** of runway / triage / presets stays in `apps/web` and `apps/mobile` separately.              |
| **V. Mobile-native fidelity**    | Pass — no shared UI components; mobile implements its own screens using `api-client` / REST.                                                                                    |
| **Package dependency flow**      | Pass — `core` ← `domain` ← `db` / `validation` / `api-client`; packages do not depend on apps.                                                                                  |
| **Spec-driven implementation**   | Pass — behavior and fields come from `spec.md` + this plan + `data-model.md` + contracts; legacy app not a source of truth.                                                     |
| **Pragmatic quality / tests**    | Pass — prioritize tests for **domain fit/triage rules** and **critical API** paths; full E2E optional until web/mobile flows stabilize.                                         |

### Post-design re-check (after Phase 1 artifacts)

All gates remain **Pass**. `research.md` resolves modeling choices; `data-model.md` and `contracts/day-planning-rest.md` keep boundaries clear without introducing forbidden cross-package UI dependencies.

## Project Structure

### Documentation (this feature)

```text
specs/003-vision-aligned-rebuild/
├── plan.md              # This file
├── spec.md
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1
│   └── day-planning-rest.md
└── checklists/
    └── requirements.md
```

`tasks.md` is produced by **`/speckit-tasks`**, not by this command.

### Source Code (repository root)

```text
/Users/santi/dev/day.party/
├── packages/
│   ├── core/src/models/           # Task (actionable) shapes, DayRundown evolution, prefs types
│   ├── domain/src/
│   │   ├── actions/               # getRundown, create/update/reorder, triage, ledger hooks
│   │   └── interfaces/          # repository ports (tasks, prefs, history, rewards, …)
│   ├── db/src/                    # Mongo implementations of new/updated ports
│   ├── validation/src/schemas/    # Zod for new fields and endpoints
│   └── api-client/src/            # DayPartyClient parity with REST
├── apps/
│   ├── api/src/
│   │   ├── index.ts               # Composition: wire new repos + actions
│   │   ├── routes/                # tasks.ts evolution; possible prefs/history/rewards routes
│   │   └── types.ts               # ApiEnv (prefer domain ports per 002 alignment)
│   ├── web/src/                   # Planning UI, presets, triage (React)
│   └── mobile/                    # NativeScript planning UI (separate from web)
└── apps/web-legacy/               # Reference only — not implementation blueprint
```

**Structure Decision**: Single monorepo with **shared domain + validation + api-client** and **per-platform UI**, matching existing day.party layout and constitution. Feature work **extends** the task/day-plan slice first (P1–P3), then adds rewards/history routes and collections (P4–P6) as separate vertical slices.

## Complexity Tracking

> No constitution violations required for this feature. Large surface area is **time-sliced** by spec priorities (P1–P6) and scoped assumptions (single user per workspace, no physical/social epics in this spec).
