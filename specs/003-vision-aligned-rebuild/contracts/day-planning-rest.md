# Contract: Day planning REST (003 vision-aligned rebuild)

**Scope**: Evolution of the Hono API under `/api/*` for flexible day planning, rewards, prefs, and history. **Baseline** today: authenticated task routes in `apps/api/src/routes/tasks.ts` (list by `date`, create, patch, reorder, delete).

**Principles**: Additive JSON fields and routes where possible; validate with `@dayparty/validation`; errors use existing `ApiError` shape (`@dayparty/core` error codes + field errors).

**Hono route ordering**: In `apps/api/src/routes/tasks.ts`, register **static paths before param routes** — e.g. `GET /` (list by query), `PATCH /reorder`, then **`GET /:id`** — so `:id` does not capture `reorder` or other literals.

---

## Existing endpoints (baseline)

| Method & path              | Purpose                     |
| -------------------------- | --------------------------- |
| `GET /api/tasks?date=`     | Rundown for user + ISO date |
| `POST /api/tasks`          | Create task                 |
| `PATCH /api/tasks/reorder` | Reorder tasks for a date    |
| `PATCH /api/tasks/:id`     | Partial update              |
| `DELETE /api/tasks/:id`    | Delete                      |

**Current rundown body** (conceptual): `{ date, tasks[], capacity, completed }` where `capacity` is sum of `size`.

---

## Planned extensions (by priority slice)

### P1 — Fit, window, estimates, runway metadata

**`GET /api/tasks?date=YYYY-MM-DD`**

- Response **adds** (non-breaking):
  - Per task (when persisted): `estimatedMinutes`, `priority` / `essentiality`, `status` (if introduced). **`notesMarkdown` MUST NOT appear in list items** once P3 ships — use optional `notesPreview` (short string) if needed; full body only on **`GET /api/tasks/:id`**.
  - **Derived** object, e.g. `dayFit`:
    - `availableMinutes: number`
    - `plannedMinutes: number`
    - `inRunwayTaskIds: string[]`
    - `outsideRunwayTaskIds: string[]`
    - `overflowUnresolved: boolean` (essential items outside runway)
  - `dayWindow` echo from user prefs (or defaults) for client display.

**`PATCH /api/tasks/:id`** / **`POST /api/tasks`**

- Body may include `estimatedMinutes`, priority fields, `status` transitions allowed by rules.

### P1 — User preferences

**`GET /api/me/preferences`** (or `/api/users/me/preferences`)

- Returns `dayWindow`, `visualPreset`, optional `sizeToMinutes`.

**`PATCH /api/me/preferences`**

- Partial update; Zod-validated.

### P2 — Triage

Option A: extend **`PATCH /api/tasks/:id`** with triage fields (`deferredToDate`, `status`).

Option B: dedicated **`POST /api/tasks/:id/triage`** with body `{ action: 'defer' | 'demote' | …, targetDate?: … }` for clearer analytics and history.

Contract **recommendation**: start with **Option A** for fewer routes; add **Option B** if payloads become unwieldy.

**`GET /api/tasks/suggestions?fromDate=&toDate=`** (optional v1)

- Returns sparse “open capacity” hints for move-to-day flow (see `research.md` §5). **Does not** model external calendars or user “busy” blocks in v1; align with `spec.md` US2 acceptance (heuristic only).

### P3 — Notes

- Task create/update accepts `notesMarkdown` (string, max length).
- **`GET /api/tasks?date=`** rundown: each task omits `notesMarkdown` (optional `notesPreview` only).
- **`GET /api/tasks/:id`**: returns full task document **including** `notesMarkdown` (authoritative read for detail view).

### P4 — Rewards and ledger

**`GET /api/rewards`** — catalog for user  
**`POST /api/rewards`** — create definition  
**`GET /api/ledger`** — paged entries + optional `balance` field  
**`POST /api/marketplace/purchase`** — body `{ rewardDefinitionId }` → ledger + side effects

(Exact paths are **suggested**; keep them **one resource family** per router file in `apps/api`.)

### P6 — History

**`GET /api/history?cursor=&limit=`**

- Returns `{ events: HistoryEvent[], nextCursor?: string }` sorted by `timestamp` descending or ascending (query flag).

---

## Authn / Authz

- All routes: **same JWT session** as existing tasks (middleware unchanged).
- **Authorization**: every read/write scoped by `userId` from session; no cross-user ids in path for v1.

---

## Client parity

`@dayparty/api-client` **MUST** gain methods matching new endpoints and types exported from `@dayparty/core` for new fields, keeping **Result&lt;T, ApiError&gt;** pattern.

---

## Versioning

Prefer **additive** changes. If a breaking change is ever required, introduce `/api/v2/...` and document migration — **out of scope** for initial 003 delivery.
