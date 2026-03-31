# Data Model: Monorepo Restructure

**Feature**: 001-monorepo-restructure
**Date**: 2026-03-31
**Source**: [spec.md](spec.md) (Key Entities + Clarifications)

---

## Entities

### Task

The core unit of work. Belongs to a user, scheduled to a specific date.

| Field         | Type    | Required | Notes                                                          |
| ------------- | ------- | -------- | -------------------------------------------------------------- |
| id            | string  | yes      | Unique identifier (MongoDB ObjectId as string)                 |
| userId        | string  | yes      | Owner reference                                                |
| title         | string  | yes      | Task description (1–500 chars)                                 |
| size          | number  | yes      | Unitless effort scale: 1 (tiny) to 5 (huge)                    |
| tagKey        | string  | no       | Reference to a Tag's key                                       |
| isComplete    | boolean | yes      | Completion state, defaults to false                            |
| scheduledDate | string  | yes      | ISO 8601 date (YYYY-MM-DD), the day this task is scheduled for |
| position      | number  | yes      | Ordering within a day's rundown (0-based)                      |
| createdAt     | string  | yes      | ISO 8601 datetime                                              |
| updatedAt     | string  | yes      | ISO 8601 datetime                                              |

**Validation rules**:

- `title`: non-empty, max 500 chars, trimmed
- `size`: integer, 1–5 inclusive
- `tagKey`: if provided, must reference an existing tag owned by the same user
- `position`: non-negative integer
- `scheduledDate`: valid ISO 8601 date string

**State transitions**:

- `isComplete`: false → true (complete), true → false (uncomplete). No other states.

---

### User

A person who uses day.party. Owns tasks and tags.

| Field       | Type   | Required | Notes                                 |
| ----------- | ------ | -------- | ------------------------------------- |
| id          | string | yes      | Unique identifier                     |
| email       | string | yes      | Unique, lowercase, used for auth      |
| displayName | string | no       | Optional display name                 |
| role        | string | yes      | "user" or "admin", defaults to "user" |
| createdAt   | string | yes      | ISO 8601 datetime                     |
| updatedAt   | string | yes      | ISO 8601 datetime                     |

**Validation rules**:

- `email`: valid email format, lowercase, unique across all users
- `role`: enum of "user" | "admin"

---

### Session

Represents an authenticated user's active login. Used for bearer token validation.

| Field     | Type   | Required | Notes                                       |
| --------- | ------ | -------- | ------------------------------------------- |
| id        | string | yes      | Unique identifier (the session/token ID)    |
| userId    | string | yes      | Reference to the owning user                |
| token     | string | yes      | JWT bearer token                            |
| expiresAt | string | yes      | ISO 8601 datetime, when the session expires |
| createdAt | string | yes      | ISO 8601 datetime                           |

**Validation rules**:

- `expiresAt`: must be in the future at creation time
- `token`: non-empty string

**Lifecycle**:

- Created on successful login (magic-link verification)
- Deleted on explicit logout or when expired
- Validated on each authenticated API request (reject if expired)

---

### Tag

A categorization label for tasks. System defaults are seeded for new users; users can create custom tags.

| Field       | Type    | Required | Notes                                            |
| ----------- | ------- | -------- | ------------------------------------------------ |
| id          | string  | yes      | Unique identifier                                |
| userId      | string  | yes      | Owner reference (tags are user-scoped)           |
| key         | string  | yes      | Machine-readable key (e.g., "work", "health")    |
| displayName | string  | yes      | Human-readable label                             |
| color       | string  | no       | Hex color code (e.g., "#FF6B6B")                 |
| icon        | string  | no       | Icon identifier (emoji or icon name)             |
| isDefault   | boolean | yes      | True if this tag was seeded from system defaults |
| createdAt   | string  | yes      | ISO 8601 datetime                                |

**Validation rules**:

- `key`: lowercase alphanumeric + hyphens, 1–50 chars, unique per user
- `displayName`: non-empty, max 100 chars
- `color`: if provided, valid hex color (#RGB or #RRGGBB)

**Default tags** (seeded on user creation):

- `work` — "Work"
- `health` — "Health"
- `hobby` — "Hobby"
- `errands` — "Errands"
- `self-care` — "Self Care"

---

### DayRundown (derived, not stored)

A computed view of a user's tasks for a specific date.

| Field     | Type   | Notes                                               |
| --------- | ------ | --------------------------------------------------- |
| date      | string | ISO 8601 date being viewed                          |
| userId    | string | Owner                                               |
| tasks     | Task[] | Tasks for this date, sorted by `position` ascending |
| capacity  | number | Sum of all task sizes for this date                 |
| completed | number | Count of tasks where `isComplete` is true           |

**Not stored in the database** — computed by querying tasks where `userId` matches and `scheduledDate` matches, then sorting by `position`.

---

## Relationships

```
User 1──* Task       (user owns tasks)
User 1──* Tag        (user owns tags)
User 1──* Session    (user has active sessions)
Task *──1 Tag        (task optionally references a tag via tagKey)
```

## Error Model

All API errors use the following shape (defined in `@dayparty/validation`):

| Field   | Type                     | Required | Notes                                                                               |
| ------- | ------------------------ | -------- | ----------------------------------------------------------------------------------- |
| code    | string                   | yes      | Machine-readable error code (e.g., "VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED") |
| message | string                   | yes      | Human-readable description                                                          |
| fields  | Record<string, string[]> | no       | Per-field validation errors, keyed by field name                                    |

**Standard error codes**:

- `VALIDATION_ERROR` (422) — input failed schema validation
- `UNAUTHORIZED` (401) — missing or invalid bearer token
- `FORBIDDEN` (403) — authenticated but lacks permission
- `NOT_FOUND` (404) — resource does not exist
- `CONFLICT` (409) — duplicate resource (e.g., duplicate tag key)
- `INTERNAL_ERROR` (500) — unexpected server error
