# Research: 003-vision-aligned-rebuild

Consolidated decisions for open questions from the implementation plan Technical Context and spec edge cases.

---

## 1. Spec term “Actionable” vs code name `Task`

**Decision**: Keep the TypeScript identifier **`Task`** (and collection naming consistent with today) for the **first implementation slices**, while treating **actionable** as the **product/spec term** in docs and user-facing copy. A **rename** to `Actionable` across `core` / API / client can be a later refactor once shapes stabilize.

**Rationale**: Avoid a monorepo-wide rename collision with 002 alignment work and existing `DayPartyClient` methods. Spec FRs are satisfied by **behavior and fields**, not by the identifier string.

**Alternatives considered**: Global rename to `Actionable` immediately (rejected: high churn, low user value early); parallel `Actionable` type alias only (acceptable follow-up if it reduces confusion in domain code).

---

## 2. Estimates: abstract `size` vs clock time

**Decision**: Introduce a canonical **`estimatedMinutes`** (or `durationMinutes`) on each task for fit/overflow. **Retain** `size` 1–5 for backward compatibility and simple UI; define a **default mapping** from `size` → minutes for migration and for clients that still send only `size` (e.g. 1→15, 2→25, … configurable later via prefs).

**Rationale**: FR-001/FR-003 require fit against a **daily window** expressed in real time; summing abstract 1–5 without a per-user scale is ambiguous.

**Alternatives considered**: Window expressed in “capacity points” only (rejected: spec emphasizes time flexibility and user-understandable overflow); remove `size` (rejected: breaks existing API and clients without migration path).

---

## 3. Daily window and midnight crossing

**Decision**: Store **per-user defaults** as `dayWindow`: `start` and `end` as **minutes from midnight** (0–1439) plus **`crossesMidnight: boolean`**. When `crossesMidnight` is true, treat the window as `[start, 1440) ∪ [0, end)]` for available minutes computation.

**Rationale**: Covers night-owl vs early-bird (spec edge case) without forcing a second timezone engine in v1; users already have implicit locale via client.

**Alternatives considered**: Store full ISO datetimes per day (heavier); single interval ignoring midnight (fails night-owl case).

---

## 4. Fit / overflow and “shaded runway” (FR-003, FR-012)

**Decision**: **Domain function** takes ordered tasks for a date, each with `estimatedMinutes`, priority/essentiality, and user window; returns:

- `availableMinutes`
- `plannedMinutes` (sum of estimates)
- ordered **`inRunway`** vs **`outsideRunway`** task id lists using a **greedy pack** in list order: walk order, accumulate until the next item would exceed `availableMinutes`; items that still fit are in-runway; the rest are outside (shaded). **Essential** items that do not fit trigger a **non-silent conflict** flag (`overflowUnresolved: true`) so the client must force a resolution path (spec edge case).

**Rationale**: Single source of truth for web and mobile; greedy pack matches “reorderable runway” mental model; essential overflow matches “no silent failure.”

**Alternatives considered**: Client-only fit (rejected: inconsistent cross-platform); CP solver / knapsack (rejected: YAGNI).

---

## 5. Triage and deferral (P2)

**Decision**: Extend task **status** (or parallel boolean flags) to include **`deferred`** and optional **`deferredToDate`**. Triage endpoints or task PATCH fields apply transitions: e.g. “tomorrow”, “specific date”, “not important now” map to concrete status + date fields. **Suggested openings** for “move to another day” can be a **simple heuristic** in v1: next N days with `availableMinutes - plannedMinutes` above a threshold, without full calendar integration.

**Rationale**: Matches acceptance scenarios; keeps v1 implementable without external calendar APIs.

**Alternatives considered**: Separate “triage queue” collection (defer until needed for analytics).

---

## 6. Expanded notes and markdown (P3)

**Decision**: Store **markdown source** on the task document as `notesMarkdown` (string, size-capped in validation). Server **does not** need to render HTML for v1; clients render subset (headings, emphasis, lists) per FR-006.

**Rationale**: One document read/write; matches Mongo document style already used for tasks.

**Alternatives considered**: Attachments collection / blob storage (defer); rich JSON block format (more work, same UX).

---

## 7. Rewards, bounties, marketplace, ledger (P4)

**Decision**: **Separate collections** (or clearly namespaced documents) for **`RewardDefinition`**, **`MarketplaceItem`**, and **`LedgerEntry`**, all keyed by `userId`. Completing a task with a bounty appends ledger entries idempotently (e.g. correlation key = `taskId + completionTimestamp` or event id). Marketplace “purchase” consumes balance per rules (FR-007).

**Rationale**: Avoid bloating the task document with unbounded history; keeps queries for balance and catalog manageable.

**Alternatives considered**: Single `users.wallet` counter only (rejected: insufficient for audit and FR-010 overlap); event sourcing everywhere (rejected: YAGNI for v1).

---

## 8. Visual presets (P5)

**Decision**: Store **`visualPreset`** string (enum) on **user preferences**; `apps/web` and `apps/mobile` each map preset → **design tokens** locally (no shared UI package). At least two presets in v1 (e.g. `calm` vs `playful`).

**Rationale**: Constitution forbids shared UI; preset is data, not components.

**Alternatives considered**: CSS variables served from API (possible later; not required for FR-009 minimum).

---

## 9. Plan history (P6)

**Decision**: Append-only **`plan_history_events`** collection: `userId`, `timestamp`, `type`, `entityId`, `payload` (before/after summary). Write side **from domain actions** when mutating tasks/prefs/triage/rewards (not only from routes) to keep one consistent stream.

**Rationale**: Satisfies chronological history and “what changed” without slowing task reads.

**Alternatives considered**: Diff from oplog (ops concern); embed last N events on user (does not scale).

---

## 10. Persistence and sync (FR-011, offline edge case)

**Decision**: **Server-authoritative** REST persistence as today; clients should **optimistic UI** with refresh-after-mutation. **Conflict resolution** policy remains **last-write-wins** per task document unless a later spec tightens it (matches spec assumption).

**Rationale**: Aligns with existing stack; full offline sync out of scope for this spec’s minimum.

**Alternatives considered**: CRDT / per-field versioning (defer).

---

## 11. API evolution strategy

**Decision**: **Extend** existing task and rundown JSON with **additive fields** (`estimatedMinutes`, `status`, fit summary, notes). Avoid breaking changes; use optional fields and sensible defaults for old clients.

**Rationale**: `DayPartyClient` and any external consumers keep working while web/mobile adopt new fields.

**Alternatives considered**: `/v2/tasks` namespace (only if additive becomes untenable).
