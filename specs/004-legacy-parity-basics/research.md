# Research: 004-legacy-parity-basics

Consolidated decisions for [`spec.md`](./spec.md) and [`plan.md`](./plan.md). Clarifications from **2026-04-02** are treated as binding.

---

## 1. Internationalization (web + mobile)

**Decision**: Ship **English (`en`)** and **Spanish (`es`)** for **004** core strings on **both** clients, persisted **per user** in preferences (see data model). Web uses a small **JSON message catalog** loaded by **`react-i18next`** (or equivalent lightweight i18n for Vite SPA). Mobile uses **NativeScript**-appropriate resources (e.g. `resources/i18n` JSON + a thin loader) without sharing UI packages.

**Rationale**: Matches spec Assumptions and FR-009; **constitution v2.2.0+** explicitly allows **multiple locales on web and mobile** when a feature spec requires it (no “Spanish-only mobile” restriction).

**Alternatives considered**: Duplicate hardcoded strings per locale (rejected — unmaintainable); shared i18n package with React/NS adapters (deferred — YAGNI until third locale).

---

## 2. Global appearance (system / light / dark)

**Decision**: Persist `colorScheme: 'system' | 'light' | 'dark'` on **`UserPreferences`** alongside existing `visualPreset`. **Web**: root element `data-color-scheme` or class; when `system`, use `prefers-color-scheme` media query. **Mobile**: read OS theme via platform APIs where available; same enum persisted from server on sync.

**Rationale**: Implements clarification **Option A** without conflating gamification presets (`visualPreset`) with OS-level light/dark.

**Alternatives considered**: Only CSS `prefers-color-scheme` with no persistence (rejected — spec requires explicit override + persistence).

---

## 3. Public landing + routing

**Decision**: Add a **public** web route (e.g. `/` or `/welcome`) with static marketing copy and CTA to `/login`; authenticated users hitting `/` may redirect to `/rundown` (product choice: single entry URL remains friendly).

**Rationale**: FR-001; minimal scope — no CMS.

**Alternatives considered**: Marketing site separate subdomain (deferred).

---

## 4. Multi-day planning (clients)

**Decision**: Hold **selected planning date** in **client state** (web: URL query `?date=YYYY-MM-DD` recommended for shareability + back button; mobile: view model property with optional persist last-used in app settings). All existing rundown APIs already accept `date`; clients stop hard-coding “today” only.

**Rationale**: No new API for “selected date”; validates FR-002 cheaply.

**Alternatives considered**: Server-stored “current browsing date” (rejected — unnecessary coupling).

---

## 5. Reorder UX

**Decision**: **Web**: pointer drag with **`@dnd-kit`** (or native HTML DnD if bundle size critical) calling existing **`PATCH /api/tasks/reorder`**. **Mobile**: list reorder gesture or explicit “move up/down” actions calling same API.

**Rationale**: API exists; accessibility: keyboard “move focus + move item” pattern on web documented in tasks.

**Alternatives considered**: Position numeric inputs only (rejected — fails spec “direct manipulation” spirit).

---

## 6. Focus mode: duration + next item

**Decision**: Expose **estimated minutes** (and/or size) editor on **Ongoing** view; on complete, show **next task** card/snippet from rundown order (same `getRundown(date)` data). Use existing **`updateTask`** for persistence.

**Rationale**: FR-005 without new domain concepts.

---

## 7. Compact focus (Document PiP)

**Decision**: **Web only**, feature-detect **`documentPictureInPicture`** (or global equivalent); mini UI subscribes to same client state / polling as main tab. Hide entry point when unsupported.

**Rationale**: FR-006 optional; aligns with spec degradation rules.

**Alternatives considered**: Always-on second BrowserWindow (Electron-only — out of scope).

---

## 8. Tag management + delete with reassignment

**Decision**: **Web + mobile** CRUD UI for tags using existing tag endpoints; **delete with usage**: new **domain action** `deleteTagWithPolicy` — if `replacementTagId` omitted, strip `tagKey` and remove tag from `bounty.tagKeys` arrays on affected tasks; if provided, rewrite references then delete tag. Expose **`DELETE /api/tags/:id`** body optional `{ replacementTagId?: string }` or dedicated **`POST /api/tags/:id/delete-with-policy`** — plan prefers **POST** with body for explicit semantics (avoid DELETE bodies in some clients).

**Rationale**: Implements clarification; single transactional boundary in domain + repo.

**Alternatives considered**: Client loops `updateTask` per row (rejected — racey, slow).

---

## 9. Operator tools (web-only, no impersonation)

**Decision**: **`/api/admin/*`** routes guarded by **`requireAdmin`** (`user.role === 'admin'`). **v1 capabilities**: user search/list by email fragment, task lookup by id/user/date, patch task under policy, **list feedback**, optional **list admin audit events**. **No** token minting as target user.

**Rationale**: FR-007/008/011; clarifications lock scope.

**Alternatives considered**: Separate `apps/admin` deployable (deferred — YAGNI; start as routes + web section under `/admin`).

---

## 10. Feedback persistence

**Decision**: Mongo collection **`feedback_submissions`**: `id`, `userId` (nullable if anonymous later — **004** requires signed-in path per triage assumptions), `body`, `category?`, `createdAt`, `clientMeta?` (app version). **GET** admin list + pagination.

**Rationale**: In-product store only; no email in v1.

**Alternatives considered**: Reuse `plan_history` (rejected — wrong semantic).

---

## 11. Operator audit trail

**Decision**: Append-only **`admin_audit_events`**: `id`, `actorUserId`, `action` (enum string), `targetType`, `targetId?`, `payloadSummary` (redacted JSON), `createdAt`.

**Rationale**: SC-004 / FR-008 accountability without over-specifying SIEM.

**Alternatives considered**: Only HTTP logs (rejected — insufficient for “what changed”).

---

## 12. Toasts / lightweight confirmations

**Decision**: **Web**: small library (**`sonner`** or **react-hot-toast**) or minimal fixed-position live region; **Mobile**: NativeScript **Toast** or subtle banner pattern.

**Rationale**: FR-011 UX consistency; avoid blocking `alert()`.

---

## 13. Keyboard shortcuts (web)

**Decision**: Central **`useHotkeys`** (e.g. **`react-hotkeys-hook`**) scoped to app shell; documented table in Settings/Help. Avoid binding single-key without modifier where it steals typing.

**Rationale**: FR-012; constitution browser accessibility note.

---

## 14. Constitution alignment

All decisions keep **domain + validation + db** boundaries, **no shared UI** between web and mobile, **spec-driven** (legacy reference only). Operator UI is **web-only** per clarification — not a fourth deployable, just **`apps/web`** routes.
