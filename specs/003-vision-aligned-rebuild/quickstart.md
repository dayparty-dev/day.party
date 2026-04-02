# Quickstart: 003-vision-aligned-rebuild (local dev)

Use this after implementation tasks land; during planning it documents **intended** validation commands and flow.

## Prerequisites

- Node compatible with repo (see root `package.json`).
- `pnpm install` from repository root.
- MongoDB 6 reachable (e.g. `mongodb://127.0.0.1:27017`), `MONGODB_URI` / `MONGODB_DB` as in `apps/api`.

## Commands

```bash
cd /Users/santi/dev/day.party
pnpm install
pnpm build
pnpm --filter @dayparty/api dev
pnpm --filter @dayparty/web dev
```

- API: default `http://localhost:3001`
- Web: default `http://localhost:5173`

## Exercise day planning API

1. Complete magic-link auth flow (existing `/api/auth/*`) and obtain JWT.
2. `GET /api/tasks?date=YYYY-MM-DD` — rundown; after P1, inspect `dayFit` and extended task fields.
3. `POST /api/tasks` — create with `estimatedMinutes` (and legacy `size` if needed).
4. `PATCH /api/tasks/reorder` — reorder runway.
5. After prefs route exists: `GET`/`PATCH /api/me/preferences` — set `dayWindow` and `visualPreset`.

## Client validation (greenfield web + mobile)

After **T049** / **T050** land:

1. From **`apps/web`**, create an actionable for the selected day (in-app UI, not `curl`).
2. From **`apps/mobile`**, create an actionable the same way.
3. Confirm each appears in `GET /api/tasks?date=YYYY-MM-DD` / rundown after refresh.

## Manual parity checklist (web vs mobile)

Use after **`tasks.md`** gap-closure tasks (**T051–T056**, **T043–T047**) land; mirror the **API ↔ client coverage matrix** in `tasks.md`. For each row, confirm **both** columns without `curl`.

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
pnpm --filter @dayparty/api test
pnpm test
```

## Spec artifacts

- Requirements: [`spec.md`](../spec.md)
- Plan: [`plan.md`](../plan.md)
- Research: [`research.md`](../research.md)
- Data model: [`data-model.md`](../data-model.md)
- REST notes: [`contracts/day-planning-rest.md`](./day-planning-rest.md)

Task breakdown: [`tasks.md`](./tasks.md) (includes **API ↔ client coverage matrix**).
