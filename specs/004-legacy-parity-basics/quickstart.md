# Quickstart: 004-legacy-parity-basics (manual verification)

Use after implementation tasks land. Assumes repo [`CLAUDE.md`](../../../CLAUDE.md) quickstart (pnpm, API, web, mobile).

## Prereqs

- MongoDB reachable; `pnpm install` at repo root.
- Seed or login as **normal** user and **admin** user (`role: admin` in DB) for operator checks.

## Web (`apps/web`)

1. **Public entry (FR-001)**
   - Log out. Open `/` (or documented landing path). Expect short value prop + link to login. Sign-in path works.

2. **Locale + color scheme (FR-009, FR-010)**
   - In settings (or prefs UI), switch **ES** / **EN**; reload — core strings follow.
   - Set **match system** vs **light** vs **dark**; toggle OS theme when on **system** — app follows; on **light/dark** — OS toggle does not change app until back to **match system**.

3. **Multi-day rundown (FR-002)**
   - Change date via control or `?date=`; rundown matches that day; return to today works.

4. **Reorder (FR-003–004)**
   - Drag or keyboard alternative; refresh — order persists.

5. **Focus: duration + next (FR-005)**
   - Ongoing: change estimate; **complete** — next item or “done” state visible.
   - **Skip** / stop focusing an item (per product rules): UI still shows **what is next** or end-of-day state.
   - Induce a **failed save** (e.g. kill API): expect a **short error acknowledgement** (toast or banner), not silent failure (FR-011).

6. **Compact focus (FR-006)** — optional
   - If browser supports PiP, open mini window; complete task; main UI consistent.

7. **Tags (FR-007)**
   - Create/edit/delete; delete with references — confirm dialog, default clear; optional reassignment path.

8. **Feedback (FR-011)**
   - Submit feedback; see toast/confirmation. As **admin** on `/admin` (or routed operator UI), see submission in list.

9. **Operator (FR-008) + SC-004**
   - Normal user: `/admin` or `GET /api/admin/users` (with user session token) → **403**.
   - Admin: user search + task patch works; destructive action requires confirm and creates **audit** row.
   - **Audit read**: `GET /api/admin/audit` as admin returns recent events including the destructive action.

10. **Shortcuts (FR-012)**
    - Open shortcut help; trigger two shortcuts; matches table.

## Mobile (`apps/mobile`)

- Repeat **locale/theme** (step 2), **multi-day** (step 3), **reorder**, **focus** (step 5), **tags**, **feedback** submit (no operator/triage UI required).

## API smoke (`curl` / client)

- `PATCH /api/user/preferences` with `locale` + `colorScheme`.
- `POST /api/feedback` → `GET /api/admin/feedback` as admin; `GET /api/admin/audit` as admin.
- `POST /api/tags/:id/delete-with-policy` with and without `replacementTagId`.
- **SC-004 spot-check** (replace `TOKEN_USER`, `TOKEN_ADMIN`, hosts):
  - `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer TOKEN_USER" "http://localhost:3001/api/admin/users?q=a"` → expect **403**.
  - After an admin destructive PATCH, `curl -s -H "Authorization: Bearer TOKEN_ADMIN" "http://localhost:3001/api/admin/audit?limit=5"` → expect JSON **items** including a recent event.

## Locale string sweep (SC-005)

Audit **30** strings across: `LandingPage`, `LoginPage`, `LogoutPage`, `RundownPage`, `CreateTaskPanel`, `TaskEditPanel`, `TaskTriageBar`, `TaskNotesPanel`, `PlanHistoryPanel`, `OngoingPage`, `RewardsPage`, `SettingsPage`, `FeedbackForm`, admin pages, and matching **mobile** views — no raw keys or mixed locales visible when one language is selected.

## Regression

- Run `pnpm build` and existing tests; confirm **003** rundown/triage/rewards still pass manual smoke.
