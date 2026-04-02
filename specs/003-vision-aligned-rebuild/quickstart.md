# Quickstart: 003-vision-aligned-rebuild (local dev)

Local validation guide for this feature; examples match shipped routes under `apps/api` (`tasks.md` **T042**).

## Prerequisites

- Node compatible with repo (see root `package.json`).
- `pnpm install` from repository root.
- MongoDB 6 reachable at `MONGODB_URI` (see below).

## Environment variables (`apps/api`)

| Variable            | Default                                          | Purpose                         |
| ------------------- | ------------------------------------------------ | ------------------------------- |
| `MONGODB_URI`       | `mongodb://127.0.0.1:27017`                      | Mongo connection string         |
| `MONGODB_DB`        | `dayparty`                                       | Database name                   |
| `PORT`              | `3001`                                           | HTTP listen port                |
| `API_PUBLIC_URL`    | `http://localhost:3001`                          | Magic-link verify URL base      |
| `WEB_PUBLIC_URL`    | `http://localhost:5173`                          | Web app URL in login links      |
| `CORS_ORIGIN`       | `http://localhost:5173`, `http://127.0.0.1:5173` | Comma-separated allowed origins |
| `MAGIC_LINK_SECRET` | dev default (change in prod)                     | Signs magic-link tokens         |

Optional: `SEED_EMAIL`, `SEED_FORCE_TASKS` for `pnpm --filter @dayparty/api run seed`.

## Commands

From the repository root:

```bash
pnpm install
pnpm build
pnpm test
pnpm --filter @dayparty/api dev
pnpm --filter @dayparty/web dev
```

- API: `http://localhost:3001` (override with `PORT`)
- Web: `http://localhost:5173`
- Health: `GET http://localhost:3001/health`

## Auth (JWT)

1. Request a magic link (check API logs for the link in dev):

```bash
curl -sS -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com"}'
```

2. Open the logged **verify** URL or call it directly; response includes a **bearer** `token`:

```bash
# Replace MAGIC with the token query param from the link
curl -sS "http://localhost:3001/api/auth/verify?token=MAGIC"
```

3. Use the token on protected routes:

```bash
export TOKEN='<paste bearer token from verify response>'
```

## Exercise day planning API (curl)

All examples assume `export TOKEN=...` and `API=http://localhost:3001`.

**Rundown & task CRUD**

```bash
curl -sS -H "Authorization: Bearer $TOKEN" \
  "$API/api/tasks?date=2026-04-02"

curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  "$API/api/tasks" \
  -d '{"title":"Example","size":3,"scheduledDate":"2026-04-02"}'

curl -sS -H "Authorization: Bearer $TOKEN" "$API/api/tasks/TASK_ID"

curl -sS -X PATCH -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  "$API/api/tasks/TASK_ID" \
  -d '{"title":"Updated title"}'

curl -sS -X PATCH -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  "$API/api/tasks/reorder" \
  -d '{"date":"2026-04-02","orderedTaskIds":["id1","id2"]}'
```

**Preferences (day window, visual preset, size→minutes)**

```bash
curl -sS -H "Authorization: Bearer $TOKEN" "$API/api/me/preferences"

curl -sS -X PATCH -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  "$API/api/me/preferences" \
  -d '{"dayWindow":{"startMinutes":540,"endMinutes":1020}}'
```

**Triage & move hints**

```bash
curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  "$API/api/tasks/TASK_ID/triage" \
  -d '{"action":"mark_skipped"}'

curl -sS -H "Authorization: Bearer $TOKEN" \
  "$API/api/tasks/suggestions?fromDate=2026-04-02&toDate=2026-04-09"
```

**Rewards, ledger, purchase**

```bash
curl -sS -H "Authorization: Bearer $TOKEN" "$API/api/rewards"

curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  "$API/api/rewards" \
  -d '{"title":"Coffee break","costPoints":50,"type":"perk"}'

curl -sS -H "Authorization: Bearer $TOKEN" "$API/api/ledger?limit=20"

curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  "$API/api/marketplace/purchase" \
  -d '{"rewardDefinitionId":"REWARD_ID"}'
```

**Plan history**

```bash
curl -sS -H "Authorization: Bearer $TOKEN" "$API/api/history?limit=20&order=desc"
```

## Client validation (greenfield web + mobile)

With **T049** / **T050** complete:

1. From **`apps/web`**, create an actionable for the selected day (in-app UI, not `curl`).
2. From **`apps/mobile`**, create an actionable the same way.
3. Confirm each appears in `GET /api/tasks?date=YYYY-MM-DD` / rundown after refresh.

## FR-011 — Cross-session persistence (manual)

**Goal**: Same authenticated user after logout/login or a new browser profile/session still sees consistent data from the server.

After you have a real account and JWT:

1. **Plan**: Create or reorder tasks; set **day window** in preferences. Log out (or clear site storage) and sign in again — same rundown date should show the same tasks and window (within normal staleness: refetch or reload the app).
2. **Notes**: Open a task, set **notes** in the web editor, save. New session → open the same task → notes match.
3. **Ledger / rewards**: Complete a **bounty** task (if configured) or note balance; purchase a reward. New session → **Rewards** / ledger UI matches API (`GET /api/ledger`).
4. **History**: Perform an edit that appends history; new session → **Plan history** panel lists the same events (`GET /api/history`).

If any step diverges, verify Mongo persistence and that the client sends `Authorization: Bearer` on each request.

## Session / offline (v1) — scope boundary

Aligned with **`spec.md`** assumptions:

- **Persistence is server-authoritative** — the API and Mongo are the source of truth after successful writes.
- **Clients** (web / mobile) **should** retry failed mutations when the network drops and **refresh** or refetch rundown / detail after a successful write so UI matches the server.
- **Out of scope for 003 v1**: a durable **offline write queue**, automatic merge when connectivity returns, and full **conflict-resolution UI**. Do not expect guaranteed offline edits without network; recovery is “retry + refresh,” not seamless multi-tab merge.

## Manual parity checklist (web vs mobile)

Use after **`tasks.md`** gap-closure and Phase 10 tasks land; mirror the **API ↔ client coverage matrix** in `tasks.md`. For each row, confirm **both** columns without `curl`.

| Check                                                                         | Web (`apps/web`) | Mobile (`apps/mobile`) |
| ----------------------------------------------------------------------------- | ---------------- | ---------------------- |
| Create task (title, size, estimates)                                          | T049             | T050                   |
| Optional **bounty** on create                                                 | T053             | T056                   |
| Open task **editor**: title, size, minutes, essentiality, tag, scheduled date | T051             | T054                   |
| Set/clear **bounty** on existing task                                         | T051             | T054                   |
| **Start / Pause** (`planned` ↔ `in_progress`)                                 | T052             | T055                   |
| **Triage**: defer, demote, skip / clear skip + hints                          | T020             | T043                   |
| **Notes** markdown detail                                                     | T023             | T044                   |
| **Rewards** balance, catalog, purchase                                        | T030             | T045                   |
| **Visual preset** (after US5)                                                 | T033             | T046                   |
| **Plan history** read-only (after US6)                                        | T039             | T047                   |

## Tests (when slices exist)

```bash
pnpm --filter @dayparty/domain test
pnpm test
```

(`@dayparty/api` has no `test` script today; root `pnpm test` runs configured package tests after build.)

## Spec artifacts

- Requirements: [`spec.md`](./spec.md)
- Plan: [`plan.md`](./plan.md)
- Research: [`research.md`](./research.md)
- Data model: [`data-model.md`](./data-model.md)
- REST notes: [`contracts/day-planning-rest.md`](./contracts/day-planning-rest.md)

Task breakdown: [`tasks.md`](./tasks.md) (includes **API ↔ client coverage matrix**).
