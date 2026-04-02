# Feature Specification: First-party parity with legacy baseline capabilities

**Feature Branch**: `004-legacy-parity-basics`  
**Created**: 2026-04-02  
**Status**: Draft  
**Input**: User description: "we've implemented a nice amount of functionalities but we're still missing some basic functionality that was already present in the legacy web app. WITHOUT re-using code directly from there, please check the existing project to create a full set of functionality that can be used for later iterations in the new project. Then create the spec for that missing features."

**Scope note**: This specification inventories **user-visible and operator-visible capabilities** that existed in the reference legacy web application and are **not yet represented** in the new first-party web and mobile experiences (or are only partially represented). It intentionally does **not** prescribe copying legacy source code. It complements the vision-aligned rebuild (**003**): **003** defines the target product; **004** closes **baseline gaps** so day-to-day use and operations do not regress versus what users could already do in the reference experience.

**Related artifacts** (004 implementation): [`plan.md`](./plan.md) · [`tasks.md`](./tasks.md) · [`data-model.md`](./data-model.md) · [`contracts/legacy-parity-rest.md`](./contracts/legacy-parity-rest.md) · [`quickstart.md`](./quickstart.md)

**Related context**: [`specs/003-vision-aligned-rebuild/spec.md`](../003-vision-aligned-rebuild/spec.md) (core planner, triage, notes, rewards, presets, history).

## Clarifications

### Session 2026-04-02

- Q: For operator tools (User Story 7), should “act as user” / impersonation be in scope for the first delivery of this feature? → A: **No impersonation in 004 v1** — operators may search, inspect, and correct data from operator tools, but do not assume the end-user’s session or identity (Option B).
- Q: When a user deletes a tag still assigned to actionables, what should happen? → A: **User-confirmed delete with default clear; optional reassignment** — the product prompts before deletion; the **default** outcome is to **remove** that tag from the catalog and **clear** it on every affected actionable; the user may **optionally** choose to **reassign** all affected references to **another** existing tag in the same confirmation step.
- Q: After someone submits in-app product feedback, where should it go for 004 v1? → A: **In-product store only (Option A)** — submissions are **persisted in the product** and triaged via **operator/support tooling** (or a minimal internal list); **004 v1 does not require** outbound email or external ticketing integrations.
- Q: For 004 v1, should operator/support tools be required on mobile as well as web? → A: **Web only (Option A)** — operator/support tooling (including feedback triage) is **required** on the **web** client; the **mobile** client remains **end-user-only** for 004 v1 (no operator UI requirement on mobile).
- Q: How should global light/dark relate to the device/OS theme? → A: **System default + override (Option A)** — the app **follows the OS/device** light–dark preference **by default**; the user can set an **explicit** light or dark mode that **overrides** until they clear it or choose **match system** again.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browse and sign up from a public entry point (Priority: P1)

A visitor who is not signed in understands what the product offers and can start sign-in from a dedicated public page, instead of being dropped straight into an authentication screen with no context.

**Why this priority**: The legacy app provided a clear marketing-style entry; the new experience currently routes anonymous users primarily toward sign-in, which hurts discovery and trust for new users.

**Independent Test**: From a logged-out browser session, open the product root URL and complete a path that explains value and reaches the sign-in flow without needing a direct deep link.

**Acceptance Scenarios**:

1. **Given** a visitor who has never signed in, **When** they open the product’s public entry URL, **Then** they see concise positioning (what the product does) and a clear call to start sign-in.
2. **Given** that public page, **When** they choose to sign in, **Then** they are taken to the existing sign-in experience without losing their place in a confusing way.

---

### User Story 2 - Work across calendar days, not only “today” (Priority: P1)

A signed-in user opens their plan for **other dates** (yesterday, tomorrow, or an arbitrary day) to review, adjust, or prepare, using a date control that matches how they think about their week.

**Why this priority**: The reference rundown was built around moving between days; the new first-party clients currently center on “today” only, which blocks review and forward planning.

**Independent Test**: Change the selected planning date, load that day’s plan, and perform at least one meaningful action (view tasks, edit one item, or move an item) for a non-today date on **both** primary clients (web and mobile).

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they pick another calendar date, **Then** the plan content reflects that date’s items and capacity context.
2. **Given** a different date selected, **When** they return to today, **Then** today’s plan loads without requiring a full sign-out or manual refresh ritual.
3. **Given** an invalid or empty date choice, **Then** the product recovers gracefully (clear message or revert to a safe default).

---

### User Story 3 - Reorder the day plan with direct manipulation (Priority: P2)

A user changes the **order** of items in their day list quickly (e.g. drag or an equivalent accessible pattern) so the runway matches their actual intent without opening each task’s details.

**Why this priority**: Reference users could reorder visually; the underlying product already supports persisting a new order, but the primary clients do not yet expose a discoverable reorder interaction.

**Independent Test**: Reorder multiple items and confirm the new order persists after leaving and returning to the plan on web and on mobile.

**Acceptance Scenarios**:

1. **Given** at least two incomplete items on a day, **When** the user moves one above or below another using the supported reorder interaction, **Then** the list reflects the new order immediately.
2. **Given** a saved order, **When** the user reloads the plan or switches away and back, **Then** the same order is shown.
3. **Given** a user who cannot use pointer drag (e.g. keyboard or assistive tech), **When** they use the documented alternative, **Then** they can achieve the same reorder outcome.

---

### User Story 4 - Adjust focus session and see what’s next (Priority: P2)

During “now” / focus mode, a user can **refine how long they intend to spend** on the current item (within reasonable bounds), **complete** it, and see **what comes next** without returning to the full list.

**Why this priority**: The legacy ongoing view coupled progress, duration adjustment, and a peek at the next item; the new focus view emphasizes elapsed progress and completion but omits comparable mid-session sizing and next-item context.

**Independent Test**: From focus mode, change the current item’s planned effort, mark it complete, and confirm the UI advances to the next appropriate item with updated timing hints.

**Acceptance Scenarios**:

1. **Given** a focus session on an item, **When** the user adjusts the intended duration (or size equivalent) within allowed limits, **Then** progress and labels reflect the new target and persist for that item.
2. **Given** a completed focus item with more work left today, **When** completion is recorded, **Then** the user sees the next item (or an explicit “done for the day” state).
3. **Given** a focus item the user **skips** or otherwise **stops focusing** while other open items remain today, **When** the product updates focus state per its rules, **Then** the user sees **what item is now treated as next** (or the same “done for the day” style state if none).
4. **Given** adjustment would violate validation rules, **Then** the user sees a clear message and the previous valid value is preserved.

---

### User Story 5 - Optional compact focus surface (Priority: P3)

A user who works across windows keeps a **small, always-visible** view of the current focus item and primary actions where the **underlying platform** supports a separate compact window alongside the main app.

**Why this priority**: The reference app experimented with a floating mini-window for task focus; this is valued for multitasking and is absent from the new web focus experience.

**Independent Test**: On a supported environment, open the compact focus surface, perform at least start/pause or complete from it, and confirm state stays in sync with the main app.

**Acceptance Scenarios**:

1. **Given** a supported client and environment, **When** the user opens the compact focus view, **Then** it shows the current focus item and primary controls.
2. **Given** the compact view open, **When** the user completes an action there, **Then** the main plan and focus screens reflect the same state when reopened.
3. **Given** an environment that does not support a compact window, **When** the user looks for compact focus, **Then** the feature is hidden or explained as unavailable without breaking the standard focus flow.

---

### User Story 6 - Manage tags without leaving the planner (Priority: P3)

A user creates, renames, recolors, or removes **their own tags** from settings or inline flows, so task labels stay meaningful as their life areas evolve.

**Why this priority**: The reference app included richer tag editing; the new clients mostly **consume** tags from the product backend but do not yet expose full tag lifecycle management in the UI even where the backend allows it.

**Independent Test**: Create a new tag, assign it to a task, edit its display attributes, and remove or archive it according to product rules without data loss to unrelated tasks.

**Acceptance Scenarios**:

1. **Given** tag management is opened, **When** the user creates a tag with a unique key and optional color, **Then** it appears in task pickers.
2. **Given** an existing tag, **When** the user updates its label or color, **Then** tasks using it show the updated presentation.
3. **Given** a tag that is **not** referenced by any actionable, **When** the user deletes it, **Then** it is removed after a simple confirm (or equivalent) with no further prompts.
4. **Given** a tag still referenced by one or more actionables, **When** the user chooses to delete it, **Then** they see how many actionables are affected and a confirmation that explains the **default**: remove the tag and **clear** those references (actionables no longer carry that tag for that use).
5. **Given** that delete confirmation, **When** the user selects an **optional reassignment** to another existing tag and confirms, **Then** every affected reference is updated to that tag and the old tag is removed, with no silent corruption.
6. **Given** that delete confirmation, **When** the user accepts the **default** (clear) and confirms, **Then** affected actionables lose that tag reference and the tag is removed from the catalog.

---

### User Story 7 - Operator and support tools for privileged roles (Priority: P3)

An **administrator** (or similarly privileged role) can search users and tasks and create or correct records **from operator tools, acting under their own privileged identity**—so support and staging workflows remain possible without database access. **User impersonation** (viewing or mutating data **as** another user’s session) is **out of scope for 004 v1** and may be specified in a later change if needed.

**Why this priority**: The reference app embedded operator tools; the new product recognizes admin roles when people sign in but does not yet surface equivalent operational flows in first-party clients.

**Independent Test**: With a privileged account on the **web** client, complete a controlled user lookup and a task correction flow; with a normal account on **web**, confirm those entry points are unreachable. **004 v1** does **not** require operator surfaces on **mobile**.

**Acceptance Scenarios**:

1. **Given** a privileged account on **web**, **When** they open operator tools, **Then** they can search and open a user or task record within permission limits.
2. **Given** a normal account on **web**, **When** they attempt to open the same tools, **Then** access is denied without leaking whether specific records exist.
3. **Given** any destructive operator action, **When** it is executed, **Then** it requires confirmation and leaves an audit-friendly trace (description-level: “recorded for accountability”).

---

### User Story 8 - Language choice and global appearance (Priority: P4)

A user switches **interface language** among supported locales and controls **global light/dark (or high-level) appearance** in addition to any in-product “look and feel” presets, so the app matches their environment and accessibility needs—including **following the OS** unless they pin an explicit preference.

**Why this priority**: The reference layout included language switching and theme controls alongside content; the new clients currently lean on English-first copy and preset-based styling without the same baseline locale and theme affordances.

**Independent Test**: Change language and observe that primary navigation and core planner strings update; with **match system** (or first launch default), change the device/OS appearance and confirm the app follows where the platform allows; set an **explicit** light or dark override and confirm it holds across main screens until cleared or switched back to **match system**.

**Acceptance Scenarios**:

1. **Given** at least two supported locales, **When** the user selects a different language, **Then** core screens use that locale’s strings after reload or immediate update per design.
2. **Given** the user has **not** set an explicit global appearance override (or has chosen **match system**), **When** the OS/device switches between light and dark (where observable), **Then** the app’s global appearance follows on **both** primary clients within normal platform limits.
3. **Given** global appearance settings, **When** the user selects **explicit** light or dark, **Then** that choice applies consistently across primary screens and **overrides** the OS until the user selects **match system** again or clears the override per UX design.
4. **Given** explicit light or dark, **When** the user views core interactive elements, **Then** backgrounds and text meet contrast expectations for those elements.
5. **Given** an unsupported locale request, **Then** the product falls back predictably (e.g. default locale) with no broken layout.

---

### User Story 9 - In-app feedback and lightweight notifications (Priority: P4)

A user submits **product feedback** (bugs, ideas) from within the app and receives **short, non-blocking confirmations** when important actions succeed or fail (beyond inline form errors).

**Why this priority**: The reference app included feedback hooks and brief global confirmations; the new clients rely more on inline banners and may omit a consistent feedback channel.

**Independent Test**: Submit feedback with valid input and see confirmation; confirm a **privileged** user can find that submission in operator/support triage **on web**; trigger a repeatable success action elsewhere and observe a brief, accessible confirmation pattern.

**Acceptance Scenarios**:

1. **Given** the feedback entry point, **When** the user submits a message with required fields, **Then** the submission is **stored in the product**, they see confirmation it was **received**, and optional expectations on follow-up are clear.
2. **Given** a stored submission, **When** a user with **operator/support access** opens the triage surface on **web**, **Then** they can see the submission among others (with enough context to act), without requiring email or an external ticket system for **004 v1**.
3. **Given** a successful save elsewhere in the app, **When** the operation completes, **Then** the user gets a concise confirmation that does not trap focus.
4. **Given** feedback submission fails, **Then** the user sees what to try next without losing their draft where possible.

---

### User Story 10 - Power-user shortcuts (Priority: P5)

A frequent user performs common actions from the keyboard (open search, toggle panels, navigate between main sections) where the **web** client runs on desktop-class devices.

**Why this priority**: The reference app wired several shortcuts in operator and global contexts; the new web app does not yet document or expose comparable accelerators.

**Independent Test**: From the web client, use documented shortcuts to reach at least two primary destinations or toggles without using the pointer.

**Acceptance Scenarios**:

1. **Given** focus in the main app shell, **When** the user invokes a documented shortcut, **Then** the corresponding action runs without conflicting with browser or OS defaults where avoidable.
2. **Given** a shortcut table in help or settings, **When** the user reads it, **Then** it matches actual behavior on a reference desktop browser.

---

### Edge Cases

- **Timezone and midnight**: Selecting a “calendar day” near midnight uses the user’s configured or device-local interpretation consistently with the existing day-window rules.
- **Empty plans**: Changing dates when a day has no tasks still shows a helpful empty state and allows adding items if the product supports creation for that date.
- **Concurrent edits**: Reorder or tag changes made on two devices near-simultaneously resolve without silent loss; the user sees the latest server state or a clear conflict message.
- **Tag delete while another device edits**: If an actionable’s tag reference changes during a delete flow, the product applies the user’s confirmed delete or reassignment to the **current** server state at commit time, or surfaces a clear error and lets the user retry without partial mystery state.
- **Privilege misuse**: Operator tools resist accidental broad deletes; rate limits or extra confirmation apply where appropriate.
- **Compact focus disconnected**: If the compact window loses connection to the main app, the user can recover without corrupted task state.
- **Feedback content**: Free-text feedback may contain personal data; retention and access follow the product’s privacy posture and operator access rules (exact policy is out of band for this spec, but submissions MUST NOT be world-readable).
- **OS theme vs override**: If the user sets an **explicit** global appearance, **OS changes alone** MUST NOT change the app until they return to **match system** (or equivalent).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The product MUST expose a **public entry experience** (before authentication) that states the product’s purpose and offers a path to sign-in.
- **FR-002**: Signed-in users MUST be able to **select an arbitrary planning date** and view that date’s plan on **both** primary clients (web and mobile), not only the current calendar day.
- **FR-003**: Signed-in users MUST be able to **change the ordered sequence** of items for a given planning day through a direct-manipulation interaction on supported pointers, with an **accessible alternative** that achieves the same outcome.
- **FR-004**: The ordered sequence MUST **persist** across navigation and sessions for that day until changed again. _(Delivered together with FR-003 via the same reorder interaction and server-backed order.)_
- **FR-005**: Focus / “now” mode MUST allow **updating the current item’s intended effort** (duration or equivalent) within validated bounds and MUST surface **what item will follow** when the current one is completed or skipped per product rules.
- **FR-006**: Where the platform supports it, the web client SHOULD offer an **optional compact focus surface** (separate small window) that stays synchronized with task state; on unsupported platforms the feature MUST degrade cleanly.
- **FR-007**: Users MUST be able to **manage their tag catalog** (create, update presentation, delete, and **consolidate references** per defined rules) from first-party clients wherever the product backend allows, without relying on staff-only tools. For **004 v1**, **“merge”** means **reassigning all references from one tag to another** (notably via **delete-with-reassignment**); a separate **“merge two tag definitions into one key”** wizard is **out of scope** unless added in a later spec. **Deleting a tag** that is still referenced MUST require **explicit confirmation** showing impact; the **default** outcome MUST **clear** that tag from all affected actionables and remove the tag; the user MUST **optionally** be able to **reassign** all affected references to **one** other existing tag in the same step before confirming.
- **FR-008**: Users with a **privileged role** MUST have access to **operator capabilities** (search, inspect, and mutate users/tasks within policy) on the **web** client, acting **as the operator**, not as the end user; **session impersonation** (“act as user”) is **out of scope for 004 v1**. The **mobile** client MUST **not** be required to expose operator UI in **004 v1**. Sensitive actions MUST be **auditable**; users without that role MUST be denied.
- **FR-009**: The product MUST support **at least two locales** for core UI strings (including the language historically emphasized in the legacy product) and MUST persist the user’s choice until changed.
- **FR-010**: Users MUST be able to control **global appearance** (light/dark or equivalent) **independent of gamification-oriented visual presets**, and it MUST apply consistently across primary screens. **By default** (and when the user chooses **match system**), global appearance MUST **follow the OS/device** light–dark preference where the platform exposes it. The user MUST be able to set an **explicit** light or dark mode that **overrides** the OS until they choose **match system** again (or clear the override). This preference MUST persist across sessions on **both** primary clients.
- **FR-011**: The product MUST provide an **in-app feedback** submission path; each successful submission MUST be **persisted in the product** (durable record). **Privileged** operator/support users MUST be able to **list and review** submissions for triage on **web** in **004 v1** without requiring outbound email or external ticketing as part of this feature. The product MUST also use a consistent pattern for **short, non-blocking acknowledgements** for routine operations: **success** (e.g. save completed) and **failure** (e.g. network or validation error) so users are not left guessing, without trapping focus.
- **FR-012**: The web client SHOULD expose **documented keyboard shortcuts** for frequent navigation or toggles on desktop-class devices, without breaking essential browser accessibility.

### Key Entities _(include if feature involves data)_

- **Planning date selection**: The calendar date whose rundown is shown; must stay consistent while editing, reordering, and navigating sub-views.
- **Tag catalog**: User-scoped labels with stable keys and display attributes; linked from actionables and bounty scope where applicable. **Deletion** removes the tag from the catalog after user confirmation; references either **clear** (default) or **reassign** to one chosen replacement tag.
- **Focus session state**: Which item is active, elapsed vs intended effort, and queue position for “next” presentation.
- **Operator action record**: A logical record that a privileged action occurred (who, what category of change, when) for accountability.
- **User locale and appearance preferences**: Chosen language; global theme as **match system**, **light**, or **dark** (or equivalent), persisted and distinct from optional visual presets.
- **Feedback submission**: A persisted record of user-submitted product feedback (required fields per UX), associated submitter identity where the user is signed in, and timestamps; visible to privileged triage **on web**, not to other end users.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In moderated usability tests, **at least 80%** of participants find how to **open another day’s plan** within **two minutes** without coaching.
- **SC-002**: **At least 90%** of attempted **reorder** operations in testing result in the expected persisted order on first try across web and mobile.
- **SC-003**: **At least 85%** of focus-mode testers successfully **adjust intended effort** and **complete** an item while reporting they understood what would happen next.
- **SC-004**: **100%** of non-privileged test accounts are **blocked** from operator tools **on web**; **100%** of privileged destructive flows tested **on web** produce an **audit-visible** trace. **Verification** for v1 MAY be **manual** (documented steps + `curl` or browser) per [`quickstart.md`](./quickstart.md); **automated** API or E2E checks SHOULD be added when a test harness exists for `apps/api` or the web app.
- **SC-005**: With locale switched, **core screens** and **primary modals/panels** used in those flows show **no mixed-locale placeholder** strings in a standard audit checklist of **30** UI strings (see **tasks.md** for the sweep list: sign-in, logout, landing, rundown + task create/edit/triage/notes/history, ongoing, rewards, settings, feedback, admin shell).
- **SC-006**: **At least 70%** of feedback submissions in a pilot are **confirmed in-app** with a clear status message; fewer than **5%** report lost drafts under normal network conditions.

## Assumptions

- **Primary clients** means the maintained first-party web and mobile applications that consume the shared backend; browser extensions and third-party clients are out of scope unless later added.
- **Parity** is **functional and experiential**, not pixel-perfect: new UX may differ as long as the capabilities above are **discoverable** and **reliable**.
- **003** remains the source of truth for **gamified planning mechanics**; this feature does not relax 003’s constraints on triage, runway fit, or rewards—it only adds missing **baseline** affordances.
- **Operator tooling** targets a **small trusted group**; exact permission matrices follow existing security policy and can start with a minimal subset (e.g. read-only user lookup before write capabilities).
- **004 v1 operator scope** explicitly **excludes impersonation**: operators use dedicated tools and their own credentials; they do not receive an end-user session or identity overlay.
- **004 v1 operator delivery** is **web-only**: mobile carries no requirement to implement operator or feedback-triage screens; privileged users use **web** for those tasks.
- **Locales** for v1 of this spec assume **English** plus **Spanish** to align with legacy user-facing copy, unless product strategy explicitly chooses a different second locale before planning.
- **Compact focus** is **optional**: if platform adoption is too narrow, delivery can prioritize FR-005 and defer FR-006 without blocking other stories.
