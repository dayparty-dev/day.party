# Quickstart: applying Tidy alignment (002)

For maintainers adding or refactoring code in the **new stack**. Full spec: [`spec.md`](./spec.md). Mapping: [`plan.md`](./plan.md) (Technical Context table). Checklist: [`contracts/architecture-checklist.md`](./contracts/architecture-checklist.md).

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

## Useful commands

From repo root (`/Users/santi/dev/day.party`):

```bash
pnpm build
pnpm --filter @dayparty/domain test
pnpm --filter @dayparty/api test
```

Adjust filters to the packages touched by your slice.
