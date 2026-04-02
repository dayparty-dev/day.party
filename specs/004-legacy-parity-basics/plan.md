# Implementation Plan: First-party parity with legacy baseline capabilities

**Branch**: `004-legacy-parity-basics` | **Date**: 2026-04-02 | **Spec**: [`spec.md`](./spec.md)  
**Input**: Feature specification from `/specs/004-legacy-parity-basics/spec.md`

## Summary

Close **baseline UX and operations gaps** between the reference legacy web app and the new **first-party web + mobile** stack: public landing, **multi-day** planning, **reorder**, richer **focus** (duration + next item), optional **compact focus** on web, full **tag lifecycle** including **delete with clear/reassign**, **in-app feedback** stored in-product, **web-only operator/support** tools (no impersonation), **en + es** locale + **system/light/dark** appearance, **toasts** and **keyboard shortcuts** on web. Implementation extends existing **Hono API**, **MongoDB** repositories, **`@dayparty/domain` actions**, **`@dayparty/validation`**, **`DayPartyClient`**, **`apps/web`**, and **`apps/mobile`** — spec- and contract-driven; **no** legacy code copy.

## Technical Context

**Language/Version**: TypeScript 5.x (strict incremental goal), Node for API  
**Primary Dependencies**: Turborepo, pnpm, Hono (`apps/api`), React 19 + Vite (`apps/web`), NativeScript 9 (`apps/mobile`), Zod (`@dayparty/validation`), MongoDB driver (`@dayparty/db`), `DayPartyClient` (`@dayparty/api-client`)  
**Storage**: MongoDB 6 — new collections `feedback_submissions`, `admin_audit_events`; extended `user_preferences` documents  
**Testing**: Existing monorepo `pnpm test` / package tests; manual checklist [`quickstart.md`](./quickstart.md)  
**Target Platform**: Web (desktop + mobile browsers), iOS/Android via NativeScript, API on Node  
**Project Type**: Monorepo — shared packages + multi-app  
**Performance Goals**: Personal-scale latency (interactive planning); admin lists paginated; no new hard SLO beyond 003  
**Constraints**: Operator **web-only**; **no impersonation** in v1; feedback **no outbound email** in v1; constitution **no shared UI** between web and mobile  
**Scale/Scope**: ~10 user stories (P1–P5); touches most layers but incremental delivery per story is possible

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                                                   | Status                                                                                               |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Simplicity-first / YAGNI                                                    | **Pass** — reuse existing task/tag/rundown APIs where possible; new surfaces only where spec demands |
| TypeScript everywhere                                                       | **Pass**                                                                                             |
| Tidy + Pod pattern (`core` / `domain` / `db` / `validation` / `api-client`) | **Pass** — new actions in `domain`, repos in `db`, Zod in `validation`                               |
| Shared core, platform-specific UI                                           | **Pass** — web admin + PiP + i18n web stack; mobile own screens                                      |
| Mobile-native fidelity                                                      | **Pass** — NS-specific date controls, reorder, theme hooks                                           |
| Spec-driven; legacy reference only                                          | **Pass** — plan/contracts derive from `spec.md` + clarifications                                     |
| Pragmatic quality / tests not gate-blocking prototype                       | **Pass**                                                                                             |

**Post-design re-check**: Data model and contracts stay within Mongo + REST; no new deployable app — **Pass**.

## Project Structure

### Documentation (this feature)

```text
specs/004-legacy-parity-basics/
├── plan.md                 # This file
├── research.md             # Phase 0
├── data-model.md           # Phase 1
├── quickstart.md           # Phase 1
├── contracts/
│   └── legacy-parity-rest.md
├── spec.md
└── tasks.md                # /speckit-tasks (not produced by plan)
```

### Source Code (repository root)

```text
apps/api/src/
├── routes/                 # e.g. feedback.ts, admin/*.ts, extend user prefs
├── middleware/             # requireAdmin
└── index.ts                # wire env + routes

apps/web/src/
├── pages/                  # Landing, Admin, Settings/help, extend Rundown/Ongoing
├── components/             # Reorder list, tag manager, toasts, PiP shell
├── i18n/                   # locales en.json, es.json
└── hooks/                  # hotkeys, color-scheme

apps/mobile/src/
├── views/                  # date nav, reorder, tag UI, feedback, theme/locale
└── services/               # prefs sync if needed

packages/core/src/models/   # UserPreferences extension types
packages/domain/src/        # actions: feedback, admin audit, tag delete policy
packages/db/src/repositories/
packages/validation/src/schemas/
packages/api-client/src/    # new methods + types
```

**Structure Decision**: Single monorepo as today. **Operator UX** lives under **`apps/web`** (e.g. `/admin` route tree), not a separate deployable, to satisfy **004 v1 web-only** operator delivery with minimal ops overhead.

## Complexity Tracking

No constitution violations requiring justification. Operator + audit + feedback add surface area but are **spec-mandated** and bounded (no impersonation, no mobile operator UI).

## Phase 0 & Phase 1 Outputs

| Artifact            | Path                                                                   |
| ------------------- | ---------------------------------------------------------------------- |
| Research            | [`research.md`](./research.md)                                         |
| Data model          | [`data-model.md`](./data-model.md)                                     |
| REST additions      | [`contracts/legacy-parity-rest.md`](./contracts/legacy-parity-rest.md) |
| Manual verification | [`quickstart.md`](./quickstart.md)                                     |

## Implementation sequencing (suggested)

1. **Preferences API + types**: `locale`, `colorScheme` end-to-end (unblocks i18n + theme on both clients).
2. **Web landing + routing** + **i18n** skeleton + **theme** wiring.
3. **Rundown date** state (web URL + mobile VM) + suggestions/hints reuse.
4. **Reorder** UI → existing reorder endpoint.
5. **Focus** enhancements + **next task** preview.
6. **Tag** management UI + **`delete-with-policy`** domain + route.
7. **Feedback** POST + Mongo + **admin list** + web triage page.
8. **`requireAdmin`** + **admin audit** writes + minimal user/task admin PATCH.
9. **Toasts** + **keyboard shortcuts** + help.
10. **Document PiP** compact focus (feature-detect last).

## Next step

Run **`/speckit-tasks`** to generate [`tasks.md`](./tasks.md) from this plan and contracts.
