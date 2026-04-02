# Data model: 004-legacy-parity-basics

Extends [`specs/003-vision-aligned-rebuild/data-model.md`](../003-vision-aligned-rebuild/data-model.md). New or extended entities for [`spec.md`](./spec.md).

---

## Entity: User preferences (extended again)

Existing: `userId`, `dayWindow`, `visualPreset`, `sizeToMinutes?`, `updatedAt`.

| Field         | Type                          | Notes                                        |
| ------------- | ----------------------------- | -------------------------------------------- |
| `locale`      | `en` \| `es`                  | FR-009; default `en` until set               |
| `colorScheme` | `system` \| `light` \| `dark` | FR-010; `system` = follow OS                 |
| …existing     |                               | `visualPreset` unchanged (gamification look) |

Validation: patch schema allows optional `locale`, `colorScheme`.

---

## Entity: Feedback submission

| Field       | Type       | Notes                                                       |
| ----------- | ---------- | ----------------------------------------------------------- |
| `id`        | string     |                                                             |
| `userId`    | string     | Submitter (signed-in); required for **004 v1** triage flows |
| `message`   | string     | Required; max length (e.g. 4–8k) in Zod                     |
| `category`  | enum?      | e.g. `bug` \| `idea` \| `other` — optional                  |
| `createdAt` | ISO string |                                                             |
| `userAgent` | string?    | Optional client hint                                        |

Relationships: many submissions per user; **not** visible to other end users.

Indexes: `createdAt` desc for admin list; `userId` for support lookup.

---

## Entity: Admin audit event

| Field         | Type       | Notes                                                                           |
| ------------- | ---------- | ------------------------------------------------------------------------------- |
| `id`          | string     |                                                                                 |
| `actorUserId` | string     | Admin who performed action                                                      |
| `action`      | string     | Stable enum: `user.view`, `task.patch`, `feedback.list`, `tag.delete_policy`, … |
| `targetType`  | string     | e.g. `user`, `task`, `tag`, `feedback`                                          |
| `targetId`    | string?    |                                                                                 |
| `summary`     | string     | Human-readable, no secrets                                                      |
| `metadata`    | object?    | Redacted key facts (no raw PII beyond ids)                                      |
| `createdAt`   | ISO string |                                                                                 |

Append-only. Written on **destructive or sensitive** admin operations (FR-008, User Story 7).

---

## Entity: Tag (unchanged shape; new delete behavior)

Tag documents remain as today. **Delete with policy** (spec clarification):

- **No references**: delete after confirm.
- **With references**, default path: remove tag document; set `task.tagKey` to `null` where it matched; remove tag key from `task.bounty?.tagKeys` arrays if present.
- **With references + replacement**: same as above but set `tagKey` / replace key in `bounty.tagKeys` to **replacement** key before deleting old tag document.

All in one **domain action** + repository helpers (transaction or ordered writes — implementation detail; outcome: no orphaned tag id pointing to missing tag).

---

## Derived: Planning date selection

Not persisted as its own document: **client-held** `YYYY-MM-DD` for rundown/focus views, validated against calendar rules (spec edge cases). Server continues to key tasks by `scheduledDate`.

---

## Entity: Task (reference only)

No schema change required for reorder/focus/next-item beyond existing `position`, `estimatedMinutes`, `scheduledDate`, `status`, `isComplete`.
