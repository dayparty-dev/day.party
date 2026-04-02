# Feature Specification: Vision-aligned day planning rebuild

**Feature Branch**: `003-vision-aligned-rebuild`  
**Created**: 2026-04-02  
**Status**: Active  
**Input**: User description: "Re-implement legacy day planning in the current product architecture, aligned with the original gamified flexible-day vision (docs/idea.md) and documented next-steps (docs/next-steps.md). Context: original vision emphasizes flexible time pockets (not rigid time-blocking), stimulating presentation, reorderable day “runway,” rewards and optional currency, deferral of non-essential items, and future playful interfaces; next-steps list UI themes, expanded notes, change history, reliable persistence across sessions, reward marketplace, physical integrations (later), and a portable task core for multiple products."

**Related artifacts**: [`plan.md`](./plan.md) · [`tasks.md`](./tasks.md) · [`data-model.md`](./data-model.md) · [`contracts/day-planning-rest.md`](./contracts/day-planning-rest.md)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Shape a flexible day from actionables (Priority: P1)

A person plans their day as a sequence of things they want to do (exercise, work blocks, chores, rest), each with an estimated size, without being locked into rigid calendar slots. They can reorder items quickly and see how the pieces fit against the time they have available.

**Why this priority**: This is the core differentiator from classic time-blocking and matches the original “flexible moments” vision; without it, the product is just another list.

**Independent Test**: A user can **from the first-party `apps/web` and `apps/mobile` clients** (without relying on `apps/web-legacy` or ad hoc API calls alone) create several actionables, assign estimates, arrange them for the selected day, and see whether the total fits their stated day bounds—without any rewards or notes features enabled.

**Acceptance Scenarios**:

1. **Given** the first-party web or mobile app, **When** the user adds actionables with estimates and orders them for the selected day, **Then** the plan reflects that order and shows whether the combination fits within the user’s chosen day window.
2. **Given** a populated plan, **When** the user changes an estimate or reorders items, **Then** dependent items shift accordingly and fit/overflow feedback updates.
3. **Given** priorities on actionables (e.g., essential vs optional), **When** the day no longer fits everything, **Then** the system surfaces **which items sit inside vs outside the feasible runway** and their **priority**, so the user can see overflow at a glance; **actions** to shorten, defer, or drop ship in **User Story 2** (triage).

---

### User Story 2 - Triage overflow and move work to another day (Priority: P2)

When not everything planned gets done or fits, the user quickly decides what to postpone, downgrade, or reschedule, including picking another day or time from suggested openings.

**Why this priority**: The vision explicitly calls out deferral, “what stays outside the plan,” and moving items—reducing guilt and preserving momentum for neurodivergent-friendly use.

**Independent Test**: With a plan that overflows or with incomplete items at day end, the user can defer or move items without editing each one manually in a calendar grid—and **without** relying on raw REST/`curl` alone on **either** first-party client (`apps/web` or `apps/mobile`) once the story is product-complete.

**Acceptance Scenarios**:

1. **Given** items that did not run today, **When** the user opens a triage flow, **Then** they can mark an item for tomorrow, another specific day, or “not important right now” with clear outcomes for the plan.
2. **Given** an item to move, **When** the user chooses another day, **Then** they see **proposed target dates or simple capacity hints** from a v1 heuristic (remaining minutes vs planned load per day). **Explicit unavailable / busy periods** blocking suggestions are **out of scope for v1** unless user preferences later model them.
3. **Given** a full day plan, **When** the user adds one more essential item, **Then** they receive understandable feedback about overflow and at least one actionable path (shorten, defer low-priority, or extend the day window if allowed).

---

### User Story 3 - Capture richer context on actionables (Priority: P3)

Users attach longer notes or checklists to an actionable so “expand task” matches real work (meeting prep, links, sub-steps) while staying readable in the main plan view.

**Why this priority**: Listed in legacy next-steps; supports deeper use without cluttering the primary runway.

**Independent Test**: From **first-party `apps/web` and `apps/mobile`** (see **Definition of done**), create or open an actionable, add structured long-form content, collapse it in the list, reopen and edit—without rewards or history. (**`tasks.md` T023** web, **T044** mobile.)

**Acceptance Scenarios**:

1. **Given** an actionable, **When** the user adds expanded content (paragraphs, simple lists), **Then** it persists and appears when they open the detail view.
2. **Given** expanded content with lightweight formatting (headings, emphasis, lists), **When** the user saves, **Then** formatting is preserved on reload.
3. **Given** a long note, **When** the user views the day list, **Then** the list stays scannable (summary or truncated preview until expanded).

---

### User Story 4 - Rewards, bounties, and a reward marketplace (Priority: P4)

Completing actionables—especially hard or “high resistance” ones—can grant in-app currency and/or immediate perks. The user spends currency in a marketplace of rewards they care about, and can configure bounties per actionable where supported.

**Why this priority**: Central to the original gamification vision and the legacy next-step “marketplace de recompensas.”

**Independent Test**: Complete a task with a bounty, see balance increase, redeem or “purchase” a configured reward from the marketplace without needing the full flexible planner (can use a minimal list if other stories are stubbed).

**Acceptance Scenarios**:

1. **Given** a completed actionable with an attached bounty, **When** completion is recorded, **Then** the user’s balance or granted perk reflects the rules defined for that bounty.
2. **Given** currency, **When** the user selects a marketplace reward with a price, **Then** currency deducts (or rules apply) and the reward is recorded as obtained or scheduled per its type.
3. **Given** different reward types (instant gratification vs saved-for-later), **When** the user configures them, **Then** behavior matches the type (e.g., immediate reveal vs banked choice).

---

### User Story 5 - Personalize how the app feels (Priority: P5)

Users choose a presentation preset (e.g., calm, playful, high-contrast) so the experience can feel like a light game or a more conventional productivity surface, per the vision’s “levels of gamification” for interface.

**Why this priority**: Explicit legacy next-step; supports accessibility and personal preference without changing core mechanics.

**Independent Test**: Switch presets and observe typography, color, and density change consistently across main screens.

**Acceptance Scenarios**:

1. **Given** account or device settings, **When** the user selects a visual preset, **Then** primary planning screens adopt that preset until changed.
2. **Given** a preset, **When** the user uses core flows (plan, triage, rewards), **Then** UI remains within measurable usability bounds: **web** body copy at least **16px** at default zoom; **primary interactive targets** at least **44×44 CSS px** (or platform-native minimums—iOS ~44pt, Android ~48dp—on mobile). Headings and decorative text may be smaller if not required to read core actions.

---

### User Story 6 - Understand what changed in the plan (Priority: P6)

Users review a chronological history of meaningful plan edits (moves, estimate changes, completions, deferrals) for accountability and debugging “what happened to my day.”

**Why this priority**: Listed in legacy next-steps; supports trust and reflection aligned with self-growth moments in the vision.

**Independent Test**: Perform a series of edits and open history; entries appear in order with human-readable descriptions.

**Acceptance Scenarios**:

1. **Given** several edits in one session, **When** the user opens history, **Then** they see ordered events with enough context to recognize each change.
2. **Given** a deferred or moved item, **When** the user inspects history, **Then** the event references the item and the before/after placement or status at a useful level of detail.

---

### Edge Cases

- Day boundaries cross midnight (night owl vs early bird): estimates and “fit” logic remain consistent or the user can define which “day” window applies.
- All items are “essential” but the day cannot fit them: the product avoids silent failure—user must confirm what gives (time box, split task, or defer).
- Zero or negative currency: marketplace and bounty rules define clear behavior (cannot purchase; optional debt is out of scope unless explicitly added later).
- Very long notes or huge history: performance stays acceptable for typical personal use (hundreds of items, thousands of events) without requiring the user to manually purge.
- Offline or interrupted sessions: the user does not lose completed work or last-known plan state beyond a clearly communicated recovery boundary (exact sync model is an implementation concern; the outcome is no surprising data loss for the primary device session). **v1 interpretation**: see Assumptions (**Offline or interrupted sessions (v1)**) and `quickstart.md` once **T048** is done.

## Requirements _(mandatory)_

### Definition of done (first-party clients)

A user story is **product-complete** for **003** only when **both** **`apps/web`** and **`apps/mobile`** expose the **intended interactions** for that story in normal use—**not** when the REST API or domain layer alone accepts the payloads. **API-only** behavior does not satisfy functional requirements that describe **user** actions until each platform has **discoverable** UI (see **`tasks.md`** **API ↔ client coverage matrix** and **`quickstart.md`** manual checklist). Open **client tasks** (**T051–T056**, **T043–T047**, etc.) track remaining gaps.

### Functional Requirements

**Note**: **FR-004** (lifecycle) and **User Story 4** (rewards) both mention completion and ledger consistency; they describe the **same** product behavior from lifecycle vs gamification angles—not conflicting requirements.

- **FR-001**: The system MUST let users define actionables with a human-readable title, optional priority or essentiality, and an estimated duration or effort unit suitable for flexible scheduling. **First-party `apps/web` and `apps/mobile` MUST expose in-app creation** for the planner’s selected day (**`tasks.md` T049–T050**); not only via `POST /api/tasks` or `apps/web-legacy` (see **User Story 1** independent test).
- **FR-002**: The system MUST let users compose a day plan as an ordered collection of actionables against a user-defined daily window (start/end or equivalent).
- **FR-003**: The system MUST recalculate fit/overflow feedback when estimates, order, priorities, or the daily window change.
- **FR-004**: The system MUST let users complete, skip, or reopen actionables in a way that updates the plan state and any dependent rewards consistently. **First-party `apps/web` and `apps/mobile` MUST expose in-app** completion, skip/reopen, and **`planned` / `in_progress` / `deferred`** (and related) transitions the spec calls for—not only via `PATCH /api/tasks` (**`tasks.md` T051–T056**, **T043**).
- **FR-005**: The system MUST provide a triage path for items not executed or not fitting, including deferral to another day and demotion of importance where the user chooses. Triage outcomes MUST be achievable **without** ad hoc `curl` on **each** platform once the story is product-complete (**`tasks.md` T020** + **T043**, with task-edit surfaces **T051** / **T054** where users adjust fields outside triage shortcuts).
- **FR-006**: The system MUST let users attach expanded content to an actionable, including lightweight structured formatting, without forcing that content into the main list row. **First-party `apps/web` and `apps/mobile` MUST expose in-app** notes/detail for this (**`tasks.md` T023**, **T044**); not only via `GET`/`PATCH /api/tasks` alone.
- **FR-007**: The system MUST maintain a reward balance (or equivalent ledger) and let users acquire configured rewards through a marketplace or catalog interaction. **First-party `apps/web` and `apps/mobile` MUST expose in-app** balance and purchase/catalog flows once the story is product-complete (**`tasks.md` T030**, **T045**).
- **FR-008**: The system MUST allow configuration of bounties or rewards associated with specific actionables, including differentiated rewards for “high resistance” work when the user sets them up. **Bounty configuration MUST be user-editable in-app** on **both** web and mobile (**`tasks.md` T053**, **T056**, and bounty fields on the task editor **T051** / **T054**)—not only accepted by the API.
- **FR-009**: The system MUST offer at least one alternate visual preset affecting colors and density (or clearly scoped style families) across core screens. When **User Story 5** is product-complete, **first-party `apps/web` and `apps/mobile` MUST** apply presets in-app: prefs/API verification (**`tasks.md` T031**), web tokens + selector (**T032–T033**), mobile chrome (**T046**).
- **FR-010**: The system MUST record a retrievable history of material plan and actionable changes with timestamps and enough identifiers for the user to understand each event. When **User Story 6** is product-complete, **first-party `apps/web` and `apps/mobile` MUST** expose read-only history (**`tasks.md` T039**, **T047**).
- **FR-011**: The system MUST persist user data across sessions so the same user sees a consistent plan, notes, balances, and history after leaving and returning. **Verification** is tracked in **`tasks.md`** (**T042** manual checklist + **T048** session boundary, **T041** regression safety net)—not a separate persistence feature task.
- **FR-012**: The system SHOULD visualize or label actionables that fall outside the current day plan (the “shaded runway” concept—left out of today’s feasible set) when overflow occurs.

### Key Entities _(include if feature involves data)_

- **Actionable**: A unit of intended work or life activity; title; estimate; priority; **status** (`planned`, **in progress**, `done`, `skipped`, `deferred`, etc.—**including user-visible `in progress` / “focus”** per FR-004); optional bounty configuration; optional expanded content.
- **Day plan**: A date (or logical day window); ordered references to actionables; derived fit/overflow state against the user’s window and rules.
- **User preferences**: Daily window defaults; visual preset; any default bounty or reward behaviors the product exposes.
- **Reward definition**: Name; cost or grant rules; type (instant, banked, scheduled); availability in marketplace.
- **Ledger entry**: Changes to currency or perks tied to events (completion, purchase, manual adjustment if allowed).
- **History event**: User-visible record of a change (what entity, what changed, when).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A new user can build a first-day plan with at least five actionables, see fit feedback, and reorder once—all within ten minutes without assistance documentation.
- **SC-002**: In usability tests, at least 80% of participants correctly identify which items overflow a constrained day on first exposure after adding one oversized item.
- **SC-003**: After deferring or moving an item, users can find that item’s new placement or status without searching unrelated areas of the product (task-success rate target 90% in moderated tests).
- **SC-004**: Users with expanded notes report that the main day view remains scannable (qualitative: majority agree in interviews or survey after two weeks of use).
- **SC-005**: Completing a bounty-bearing actionable updates balance or perks in the same session with no conflicting figures visible in marketplace and profile surfaces.
- **SC-006**: Switching visual presets applies consistently to planning, triage, and rewards entry points with no more than two screen revisits to see the change (heuristic evaluation).
- **SC-007**: For a week of simulated edits, history lists events in chronological order with no duplicate phantom entries for single user actions (verified in test scenarios).

### How success criteria map to delivery

**SC-001** through **SC-004**, **SC-006**: validated by **moderated usability / heuristic sessions** after the relevant user stories ship (see **`tasks.md`** and **`quickstart.md`**); they are **not** automated build tasks. **SC-005** and **SC-007**: covered by implementation (**US4** / **US6** tasks) plus **T041** integration checks where applicable.

## Assumptions

- **Single primary user per workspace** for this specification; household or team sharing is out of scope unless added in a later spec.
- **Authentication and identity** exist or will exist in the hosting product; this spec does not mandate a specific method.
- **Physical integrations** (candy machine, NFC bracelets, dedicated handheld devices) and **social/community competition** are out of scope for this feature; they may be separate epics.
- **Parody social feeds or daily-changing app “skins”** imitating third-party products are aspirational; this spec does not require them for acceptance—only the preset-based personalization in FR-009.
- **Portable task core / multi-brand reuse** (e.g., personal vs professional flavors) is a strategic direction from next-steps; this spec defines the behavioral contract of the personal day-planning experience so a shared core can emerge in planning work, without prescribing package names or code layout here.
- **Sync across multiple devices** is desirable; FR-011 requires session-to-session persistence. Full conflict resolution policies are left to planning unless product owners later tighten them.
- **Offline or interrupted sessions (v1)**: persistence is **server-authoritative**; clients SHOULD retry failed mutations and refresh after success. A **full offline write queue**, merge/conflict UI, and guarantees beyond “no surprising loss on the primary session” are **out of scope** for this spec unless added in a follow-up.
- **Mobile / web parity**: both **apps/web** and **apps/mobile** MUST implement each user story’s UX for that story to be **done** on the product (constitution: platform-specific UI, shared API). Work can be **parallelized** after API contracts stabilize; `tasks.md` tracks per-surface tasks and the **API ↔ client coverage matrix** (which REST capabilities must appear in which client).
- **Regulatory or medical claims** are not made; the product is productivity and wellbeing-oriented software, not a clinical tool.

## Iterations

### Iteration 2026-04-02: Client create-task (web + mobile)

**Change**: Require in-app creation of actionables on first-party web and mobile, backed by existing `POST /api/tasks` / `DayPartyClient.createTask`.
**Scope**: Feature-wide (client UX gap closure; US1-aligned).
**Artifacts updated**: `spec.md`, `plan.md`, `tasks.md`, `quickstart.md`
**Tasks added**: T049, T050
**Tasks removed**: —
**Tasks marked complete**: — (spec-only iteration)

### Iteration 2026-04-02: Post-analyze doc alignment

**Change**: Align Phase 3 independent test with US1; document **product story-done** vs **web slice** for US2/US3; expand **FR-004**/`skip` traceability in `tasks.md`; replace stale `plan.md` baseline with current implementation state; tighten **FR-001** wording. **Follow-up (same iteration)**: `plan.md` **Implementation state** now includes US4 routes, **T049–T050** shipped, **T051–T056** + **T043–T047** as blocking parity; **US3** independent test and **FR-006** cite **T023**/**T044**; **tasks.md** **T014**/**T020** use **`TaskTriageBar`**; **T044 vs T054** guidance under US3.
**Scope**: Spec / plan / tasks consistency (after `/speckit-analyze`).
**Artifacts updated**: `spec.md`, `plan.md`, `tasks.md`
**Tasks added**: —
**Tasks removed**: —
**Tasks marked complete**: —

### Iteration 2026-04-02: Client parity + task editor (API vs UI drift)

**Change**: Document **API ↔ client** drift (broad `PATCH /api/tasks` vs narrow client usage); add **definition of done** for first-party clients; tighten **FR-004**, **FR-005**, **FR-008** and **Key Entities** for **in-progress** and **bounty UX**; add **coverage matrix** and tasks **T051–T056** (web/mobile task editor, focus status, bounty on create); extend **plan** / **quickstart** / **research** / **data-model** notes.
**Scope**: Feature-wide (tasks restructuring + spec alignment).
**Artifacts updated**: `spec.md`, `plan.md`, `tasks.md`, `quickstart.md`, `data-model.md`, `research.md`
**Tasks added**: T051, T052, T053, T054, T055, T056
**Tasks removed**: —
**Tasks marked complete**: —

### Iteration 2026-04-02: Speckit-analyze LOW remediation (docs)

**Change**: Align **US1** lifecycle line with **T051–T056**; clarify **US2**/**US4** independent tests (web vs **product-complete**); pin **T023** to **`TaskNotesPanel.tsx`**; fix **`quickstart.md`** same-folder links and intro; align **`plan.md`** ASCII tree spacing; add **FR-007** / **FR-009** / **FR-010** task traceability for client parity.
**Scope**: Spec / plan / tasks / quickstart wording and consistency only.
**Artifacts updated**: `spec.md`, `plan.md`, `tasks.md`, `quickstart.md`
**Tasks added**: —
**Tasks removed**: —
**Tasks marked complete**: —

### Iteration 2026-04-02: Speckit-analyze full remediation

**Change**: Set spec **Status** to **Active**; quantify **US5** acceptance (typography / touch targets); document **SC** validation vs build tasks; add **FR-004** / **US4** traceability note; tie **FR-011** to **T041** / **T042** / **T048**; split **FR-009** task roles (**T031** vs **T032–T033** / **T046**). **`plan.md`**: align tasks-generation command name. **`tasks.md`**: refocus **T031** on prefs/API verification; strengthen **T036** (no phantom duplicate history); expand **T042** and Notes for **FR-011**.
**Scope**: Spec / plan / tasks only (post-analyze closure).
**Artifacts updated**: `spec.md`, `plan.md`, `tasks.md`
**Tasks added**: —
**Tasks removed**: —
**Tasks marked complete**: —
