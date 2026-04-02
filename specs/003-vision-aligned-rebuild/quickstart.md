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

Next step: run **`/speckit-tasks`** to generate `tasks.md` from this plan.
