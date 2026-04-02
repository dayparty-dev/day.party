# REST contract additions: 004-legacy-parity-basics

Extends [`specs/003-vision-aligned-rebuild/contracts/day-planning-rest.md`](../003-vision-aligned-rebuild/contracts/day-planning-rest.md). Base URL: `/api`. All authenticated routes use `Authorization: Bearer <session>` unless noted.

## Conventions

- **Errors**: Same envelope as 003 (`code`, `message`, optional `details`).
- **Admin routes**: `403` if authenticated but `user.role !== 'admin'`. **404** for existence-hiding where spec requires (e.g. generic “not found” for non-admin probing).
- **Dates**: `YYYY-MM-DD` in query/body where applicable.

---

## User preferences (extended)

### `GET /user/preferences`

Response adds optional fields (omitted until first patch):

```json
{
  "dayWindow": { "startMinuteOfDay": 540, "endMinuteOfDay": 1020, "crossesMidnight": false },
  "visualPreset": "default",
  "locale": "en",
  "colorScheme": "system",
  "updatedAt": "2026-04-02T12:00:00.000Z"
}
```

### `PATCH /user/preferences`

Body may include:

```json
{
  "locale": "es",
  "colorScheme": "dark"
}
```

Validation: `locale` ∈ `en|es`; `colorScheme` ∈ `system|light|dark`. Merges with existing `dayWindow` / `visualPreset` patches.

---

## Feedback (end user)

### `POST /feedback`

Auth: **required** (004 v1).

Body:

```json
{
  "message": "…",
  "category": "bug"
}
```

- `message`: string, required, max length per Zod (e.g. 8000).
- `category`: optional enum `bug|idea|other`.

Response `201`:

```json
{
  "id": "…",
  "createdAt": "…"
}
```

---

## Admin — feedback triage

### `GET /admin/feedback`

Query: `cursor?`, `limit?` (default 20, max 100).

Response:

```json
{
  "items": [
    {
      "id": "…",
      "userId": "…",
      "message": "…",
      "category": "bug",
      "createdAt": "…"
    }
  ],
  "nextCursor": null
}
```

---

## Admin — users (support)

### `GET /admin/users?q=<emailSubstring>`

- `q`: optional; if absent, return empty list or recent users (product choice — document in implementation; prefer **require `q` min length** to avoid full scan).

Response: `{ "items": [ { "id", "email", "displayName?", "role" } ] }` — shape aligned with internal User DTO, no secrets.

### `GET /admin/users/:userId`

Response: safe user summary + high-level counts optional (tasks last 7 days — optional v2).

---

## Admin — tasks (support)

### `GET /admin/tasks?userId=&date=`

List tasks for user/day for inspection.

### `PATCH /admin/tasks/:taskId`

Body: subset of task patch allowed for support (align with `updateTask` validation); **must** write **admin audit** event.

---

## Tags — delete with policy

### `POST /tags/:id/delete-with-policy`

Auth: **user** (owner of tag).

Body:

```json
{
  "replacementTagId": null
}
```

- If `replacementTagId` is `null` or omitted: **clear** references (default).
- If set: must be another tag **owned by same user**; **reassign** all references, then delete `:id`.

Response: `{ "deletedTagId": "…", "affectedTaskCount": 12 }` (counts help UX).

Errors: `409` if tag still referenced and body invalid; `404` if tag not found.

---

## Admin audit (read + write)

### `GET /admin/audit?cursor=&limit=`

**004 v1**: Lists recent **admin_audit_events** (newest first) for privileged verification and support. Pagination matches `GET /admin/feedback` style (`cursor`, `limit`, `nextCursor`). **Write path** (append on sensitive admin actions) is mandatory; **read** supports SC-004 spot-checks.

---

## Notes

- **Impersonation**: **no** endpoints in 004 v1.
- **Reorder**: unchanged — `PATCH /tasks/reorder` per 003 contract.
- **Rundown**: unchanged — `date` query already supported; clients must send selected date.
