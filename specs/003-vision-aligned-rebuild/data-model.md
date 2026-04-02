# Data model: 003-vision-aligned-rebuild

Product entities derived from [`spec.md`](./spec.md) Key Entities and functional requirements. **Implementation names** use `Task` for the actionable aggregate (see `research.md` §1).

## Entity: User (existing)

| Field         | Type   | Notes                                     |
| ------------- | ------ | ----------------------------------------- |
| `id`          | string | Primary key                               |
| `email`       | string | Auth                                      |
| `displayName` | string | Optional                                  |
| `role`        | string | Existing                                  |
| …             |        | As in current `@dayparty/core` User model |

Relationships: one user has many tasks, history events, ledger entries, preference document.

---

## Entity: User preferences (extended)

Stores daily window defaults and visual preset (FR-002, FR-009, FR-011).

| Field           | Type        | Notes                                                     |
| --------------- | ----------- | --------------------------------------------------------- |
| `userId`        | string      | Unique; 1:1 with user for v1                              |
| `dayWindow`     | object      | See below                                                 |
| `visualPreset`  | string enum | e.g. `default`, `calm`, `playful`, `highContrast`         |
| `sizeToMinutes` | map?        | Optional override for size→minutes; else platform default |
| `updatedAt`     | ISO string  |                                                           |

**dayWindow**

| Field              | Type    | Notes                          |
| ------------------ | ------- | ------------------------------ |
| `startMinuteOfDay` | number  | 0–1439                         |
| `endMinuteOfDay`   | number  | 0–1439                         |
| `crossesMidnight`  | boolean | If true, window spans midnight |

Validation: if not `crossesMidnight`, require `start < end`; if `crossesMidnight`, require `start > end` (interpret as span).

---

## Entity: Task (actionable)

Maps to spec **Actionable**; persisted per user, ordered per `scheduledDate`.

| Field                        | Type                  | Notes                                                                        |
| ---------------------------- | --------------------- | ---------------------------------------------------------------------------- |
| `id`                         | string                |                                                                              |
| `userId`                     | string                | Owner                                                                        |
| `title`                      | string                | FR-001                                                                       |
| `size`                       | 1 \| 2 \| 3 \| 4 \| 5 | Legacy / quick estimate; keep for migration                                  |
| `estimatedMinutes`           | number                | Canonical estimate for fit; default from `size` if omitted                   |
| `tagKey`                     | string?               | Existing optional categorization                                             |
| `priority` or `essentiality` | enum?                 | e.g. `essential` \| `normal` \| `optional` — FR-001, FR-003                  |
| `status`                     | enum                  | `planned` \| `in_progress` \| `done` \| `skipped` \| `deferred` (FR-004, P2) |
| `deferredToDate`             | YYYY-MM-DD?           | When status implies future placement                                         |
| `scheduledDate`              | YYYY-MM-DD            | Day plan membership                                                          |
| `position`                   | number                | Order within day                                                             |
| `isComplete`                 | boolean               | Align with `status === done` or migrate toward status-only                   |
| `notesMarkdown`              | string?               | FR-006; max length enforced in Zod                                           |
| `bounty`                     | object?               | Optional reward config (P4): currency amount, tags, “high resistance” flag   |
| `createdAt` / `updatedAt`    | ISO string            |                                                                              |

Relationships: belongs to one `scheduledDate` plan context; may reference tags; spawns ledger/history entries on completion or triage.

**State notes**: Prefer a single **status** source of truth over time; if `isComplete` retained, domain actions must keep **consistent** with `status`.

---

## Entity: Day plan (derived)

Not necessarily a separate document in v1: the **day plan** is the ordered set of tasks with `scheduledDate = D` plus **derived** fit metadata.

| Concept          | Description                                                                       |
| ---------------- | --------------------------------------------------------------------------------- |
| `date`           | Logical calendar date                                                             |
| `orderedTaskIds` | Implicit from `position` sort                                                     |
| `fit`            | Derived: `availableMinutes`, `plannedMinutes`, `inRunway`, `outsideRunway`, flags |

Returned inside **rundown** API (see contracts).

---

## Entity: Reward definition

Catalog item the user can configure or system provides (FR-007, FR-008).

| Field          | Type   | Notes                                |
| -------------- | ------ | ------------------------------------ |
| `id`           | string |                                      |
| `userId`       | string | Owner                                |
| `name`         | string |                                      |
| `type`         | enum   | `instant` \| `banked` \| `scheduled` |
| `costCurrency` | number | Price in app currency                |
| `metadata`     | object | Optional (e.g. scheduling rules)     |

---

## Entity: Ledger entry

| Field         | Type    | Notes                                          |
| ------------- | ------- | ---------------------------------------------- |
| `id`          | string  |                                                |
| `userId`      | string  |                                                |
| `amount`      | number  | Positive credit, negative debit                |
| `reason`      | enum    | `task_completion`, `purchase`, `adjustment`, … |
| `correlation` | string? | Idempotency / link to task or purchase         |
| `createdAt`   | ISO     |                                                |

Relationships: append-only per user; balance = sum(amount) (with optional materialized cache on user later if needed).

---

## Entity: History event (plan audit)

| Field       | Type   | Notes                                                                        |
| ----------- | ------ | ---------------------------------------------------------------------------- |
| `id`        | string |                                                                              |
| `userId`    | string |                                                                              |
| `timestamp` | ISO    | FR-010                                                                       |
| `type`      | string | e.g. `task.created`, `task.moved`, `task.estimated_changed`, `task.deferred` |
| `entityId`  | string | Usually task id                                                              |
| `payload`   | object | Human-readable summary fields + before/after                                 |

---

## MongoDB shape (informal)

- **tasks**: existing collection, **extended** fields (additive migration; default `estimatedMinutes` from `size` for old rows).
- **user_preferences**: one doc per `userId` (new), or embed on users if team prefers single read — **decision: separate collection** for clarity and smaller user auth docs.
- **reward_definitions**: new collection.
- **ledger_entries**: new collection.
- **plan_history_events**: new collection.

Indexes (typical): `tasks`: `{ userId: 1, scheduledDate: 1, position: 1 }`; `ledger_entries`: `{ userId: 1, createdAt: -1 }`; `plan_history_events`: `{ userId: 1, timestamp: -1 }`.

---

## Validation rules (summary)

- Title non-empty; `estimatedMinutes` > 0 when provided; notes max length; bounty non-negative amounts; ledger amounts non-zero; history payload must not store secrets.
