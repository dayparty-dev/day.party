# Quickstart: applying Tidy alignment (002)

For maintainers adding or refactoring code in the **new stack**. Full spec: [`spec.md`](./spec.md). Mapping: [`plan.md`](./plan.md) (Technical Context table). Checklist: [`contracts/architecture-checklist.md`](./contracts/architecture-checklist.md).

## Peer review (SC-001)

Before closing feature **002-tidy-arch-alignment**, a **second maintainer** must review and approve the [`plan.md`](./plan.md) mapping table (reference concepts → packages/apps) as accurate for the current repo layout. The author opens the PR or doc change; the reviewer records approval in the PR or team process.

**Recorded**: SC-001 satisfied — peer approval on the `plan.md` mapping table (2026-04-02).

## Before you change a domain slice

1. **Name the slice** (e.g. “tasks CRUD”, “tag delete side effects”) so PR scope is clear.
2. Open the **architecture checklist** and skim it; you will self-check (or reviewer checks) before merge.
3. Confirm **where code goes** using the mapping:
   - Rules / orchestration → `@dayparty/domain` (actions) + `@dayparty/core` (models).
   - New persistence needs → add or extend a **port** in `@dayparty/domain`, implement in `@dayparty/db`.
   - HTTP concerns → `apps/api` routes/middleware only.
   - JSON shapes → Zod in `@dayparty/validation`, parse at route edge.

## Per-PR workflow

1. **Composition**: New dependencies are wired in `apps/api/src/index.ts` (or a small extracted builder if one exists). Avoid globals.
2. **Types**: `ApiEnv` (and similar) should depend on **domain ports**, not `Mongo*` classes, for repository fields.
3. **Tests**: Add or extend at least one **core-level** test for the slice (fake repos, no HTTP). Add adapter/integration tests when the slice changes HTTP behavior materially.
4. **Checklist**: Run through `contracts/architecture-checklist.md` for the slice; note pass/fail in the PR description if the team tracks SC-002 formally.

## When unsure

- **Constitution** overrides manifesto/reference if they conflict.
- **Spec** overrides ad hoc patterns; legacy apps are not a blueprint.
- Prefer **incremental** alignment: leave untouched code as-is unless the slice needs it (FR-006).

## Optional HTTP extensions

Today’s API is built as **`createApp(env: ApiEnv)`** in `apps/api/src/app.ts`, with `env` constructed in `apps/api/src/index.ts`. To add optional or experimental HTTP surface **without** forking domain logic in `@dayparty/domain`:

1. Prefer registering routes in `apps/api/src/app.ts` (e.g. mount another `Hono` instance with `app.route(...)`, or add handlers that call existing `env` actions).
2. If new routes need **new dependencies**, extend `ApiEnv` in `apps/api/src/types.ts`, construct those dependencies in `index.ts`, and pass them through `createApp` — optionally split a small builder module later if wiring grows.
3. Do **not** duplicate or fork core rules inside `@dayparty/domain` for one-off HTTP experiments; keep new behavior behind actions and ports when it is real product logic.

## Useful commands

From repo root (`/Users/santi/dev/day.party`):

```bash
pnpm build
pnpm --filter @dayparty/domain test   # Vitest: create-task + get-rundown core tests
pnpm --filter @dayparty/api test      # present only if the API package defines a test script
```

Adjust filters to the packages touched by your slice.
