# Data model: 002-tidy-arch-alignment (meta-entities)

This feature does not introduce new product aggregates. It defines **maintainer-facing meta-entities** from the spec (§ Key Entities) for planning and checklist purposes.

## Architecture mapping

| Field              | Description                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `referenceConcept` | One of: core, adapters, config, infrastructure (from Tidy reference) |
| `repoLocation`     | Concrete package or app path(s) in this monorepo                     |
| `notes`            | How boundaries are enforced (imports, reviews)                       |
| `version`          | Last reviewed date / PR (informal; can be git history)               |

**Relationships**: Many-to-many between reference concepts and locations (e.g. “core” spans `@dayparty/core` and `@dayparty/domain`). Single **canonical table** lives in `plan.md`; this file summarizes entity shape.

## Domain slice

| Field             | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| `name`            | e.g. tasks, tags, auth session                                 |
| `scope`           | Which routes, actions, repos are in scope for one alignment PR |
| `status`          | planned \| in progress \| done (per team convention)           |
| `checklistResult` | Pass/fail vs `contracts/architecture-checklist.md`             |

**Relationships**: A slice **uses** multiple ports and **is exercised** by one or more adapters (API routes, future jobs). **V1 slices** for this feature are enumerated in [`spec.md`](./spec.md) (Assumptions) and [`tasks.md`](./tasks.md).

## Port (repository interface)

| Field             | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| `id`              | TypeScript interface name (e.g. `TaskRepository`)           |
| `module`          | `@dayparty/domain` path under `interfaces/`                 |
| `operations`      | Method signatures (source of truth: domain interface files) |
| `implementations` | e.g. `MongoTaskRepository` in `@dayparty/db`                |

**Validation rules**: Domain code MUST only depend on the port, not on `Db` / collection types (FR-003).

## Adapter

| Field              | Description                                                                  |
| ------------------ | ---------------------------------------------------------------------------- |
| `kind`             | http \| ui-web \| ui-mobile \| client                                        |
| `module`           | e.g. `apps/api/src/routes/tasks.ts`                                          |
| `responsibilities` | Zod parse, status codes, mapping to/from DTOs, call `env.*` actions or repos |

**Validation rules**: Request/response and transport concerns stay here; core receives validated input or domain validation only (FR-005).

## State transitions

- **Domain slice**: `planned` → `in progress` → `done` when checklist passes and SC-002/SC-003 satisfied for that slice.
- **Architecture mapping**: Updated when packages or responsibilities change; requires peer review (SC-001).
