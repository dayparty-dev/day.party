# Feature Specification: Tidy architecture alignment

**Feature Branch**: `002-tidy-arch-alignment`  
**Created**: 2026-04-02  
**Status**: Approved (SC-001 mapping review complete, 2026-04-02)

**Related artifacts**: [`plan.md`](./plan.md) (Tidy ↔ monorepo mapping), [`tasks.md`](./tasks.md) (implementation checklist), [`contracts/architecture-checklist.md`](./contracts/architecture-checklist.md) (per-slice SC-002 checklist).

**Input**: User description: "we want to align the current, new architecture more with the proposed tidy architecture (see docs/broader_context/004-tidy-architecture-reference.md)"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Clear boundaries for product logic (Priority: P1)

As a maintainer, I need domain behavior (rules, orchestration, use-cases) to live in one predictable place, separate from how requests enter the system or how data is stored, so changes are safer and reviews are faster.

**Why this priority**: Misplaced logic is the main source of regressions and slows every feature; boundary clarity is the foundation for everything else in Tidy Architecture.

**Independent Test**: Pick a representative workflow; confirm that its rules and orchestration can be understood and tested without reading transport-specific or database-driver-specific code.

**Acceptance Scenarios**:

1. **Given** a documented “core vs adapter vs infrastructure” rule set for this repo, **When** a contributor adds or changes behavior for that workflow, **Then** they can place new code without ambiguity about which layer owns it.
2. **Given** a domain rule change, **When** the change is implemented, **Then** the public HTTP contract can remain stable unless the product intentionally changes it.

---

### User Story 2 - Persistence behind explicit contracts (Priority: P2)

As a maintainer, I need storage access to go through well-defined interfaces implemented in infrastructure packages, so the domain stays honest and tests can substitute fakes.

**Why this priority**: Clear repository-style boundaries match the reference implementation and reduce coupling to a specific database client or schema detail.

**Independent Test**: For a chosen aggregate or feature slice, confirm that domain code depends on an interface (port) and that a concrete implementation lives at the edge.

**Acceptance Scenarios**:

1. **Given** domain code that needs persistence, **When** it is inspected, **Then** it does not import low-level driver types or collection handles directly.
2. **Given** a repository interface, **When** tests run for core behavior, **Then** those tests can use in-memory or fake implementations without starting external services.

---

### User Story 3 - Composable application assembly (Priority: P3)

As a maintainer, I need application entrypoints to assemble dependencies from typed configuration (constructors / explicit wiring), so environments differ by config and extension points stay obvious.

**Why this priority**: Matches the reference’s “simple DI” idea and keeps growth manageable without hidden singletons.

**Independent Test**: Trace from startup to a handled request and verify dependencies are constructed in one composition area and passed inward, not pulled from globals.

**Acceptance Scenarios**:

1. **Given** a new integration (e.g. alternate notifier), **When** it is added, **Then** wiring changes are localized to composition/config rather than scattered through domain modules.
2. **Given** documented extension points (optional routes, overrides) from the reference philosophy, **When** the team needs a one-off, **Then** there is an agreed pattern that avoids forking core logic.

---

### Edge Cases

- **Partial migration**: Some areas follow the new boundaries while others are legacy-shaped; the spec assumes incremental alignment with explicit “done” slices rather than a single big-bang rewrite.
- **Monorepo layout vs single-pod folder tree**: The reference shows a single-pod repo; this monorepo may express the same boundaries via packages—conflicts are resolved by written mapping in the plan, not by forcing one physical tree.
- **Over-abstraction**: Alignment must not introduce unused base classes or layers; simplicity-first from the project constitution overrides mechanical copying of the reference.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The engineering team MUST maintain a written mapping from Tidy Architecture concepts (core, adapters, config, infrastructure) to this repository’s actual packages and folders, consistent with `docs/broader_context/004-tidy-architecture-reference.md` as the primary structural reference.
- **FR-002**: Domain-facing modules MUST remain free of imports from transport frameworks (HTTP servers, UI frameworks, mobile UI runtime) except through thin adapter modules.
- **FR-003**: Persistence access for new or refactored slices MUST be expressed as explicit interfaces (ports) consumed by domain/core code, with implementations living in infrastructure/database packages.
- **FR-004**: Application entrypoints MUST assemble dependencies explicitly (constructor injection or equivalent explicit wiring), using typed configuration objects rather than ad hoc global mutable state for new code.
- **FR-005**: Request/response adaptation (validation at the edge, status mapping, serialization concerns) MUST live in adapter layers; core actions receive already-validated inputs or perform domain validation only.
- **FR-006**: The alignment effort MUST be incremental: each deliverable slice MUST leave the codebase in a shippable state without requiring completion of the entire monorepo at once.
- **FR-007**: Testing expectations MUST be stated for core logic (fast, framework-free) versus adapter/integration tests, matching the intent of the reference’s testing strategy without mandating a specific test framework.

### Key Entities

- **Architecture mapping**: The living document that explains where core, adapters, config, and infrastructure live in this monorepo and how that relates to the reference pod layout.
- **Domain slice**: A cohesive set of use-cases (e.g. tasks, events) chosen for alignment work; used to scope incremental migration.
- **Port (repository interface)**: A contract that describes what persistence operations the domain needs, independent of storage technology.
- **Adapter**: A thin module that translates external I/O (HTTP, CLI, jobs) into core inputs and core outputs into external responses.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The architecture mapping (FR-001) exists, is linked from the feature plan and maintainer entrypoints (e.g. `AGENTS.md` per implementation tasks), and passes a peer review (at least one other maintainer approves) as “accurate for current repo layout.”
- **SC-002**: For each agreed domain slice in scope (see **Assumptions → Domain slices (v1)**), 100% of new or intentionally refactored use-cases satisfy FR-002 through FR-005 when checked against a short architecture checklist derived from this spec (binary pass/fail per slice).
- **SC-003**: For each domain slice **marked complete** in this feature increment, at least one core-level automated test exists that executes primary domain rules without requiring the public HTTP server process (verifiable by test location or documented test taxonomy). The v1 slice list and matching tests are enumerated in `tasks.md`; additional slices add tests when those slices are explicitly completed in follow-up work.
- **SC-004**: No more than one corrective follow-up PR is needed per slice after initial merge to fix boundary violations caught in review (indicates predictable, reviewable changes).

## Assumptions

- **Domain slices (v1)**: The **task aggregate** is in scope for this increment: task-related actions in `@dayparty/domain` (including rundown/capacity behavior) plus shared **`apps/api` adapter typing** (`ApiEnv` ports) that serves tasks, tags, and auth routes. **SC-003** for v1 is satisfied by core-level tests covering **at least two** distinct task actions (`create-task` and `get-rundown`)—see `tasks.md`. **Tags** and **auth/session** flows remain subject to **SC-002** whenever touched; add dedicated core tests for those slices when a future increment marks them explicitly complete (not required for v1 unless domain code there is refactored under this feature).
- **Audience**: Primary readers are engineering maintainers and leads; stories describe their workflows (clarity, safety, speed of change). Wording stays outcome-oriented and avoids naming specific frameworks in requirements.
- The normative structural reference is `docs/broader_context/004-tidy-architecture-reference.md`; the manifesto (`docs/broader_context/003-tidy-architecture-manifesto.md`) and project constitution remain higher-level guardrails; where they conflict, constitution wins.
- Scope centers on the “new stack” (shared packages and modern apps under the monorepo restructure), not on lifting legacy apps into pods unless explicitly added later.
- “Pod” physical packaging (separate publishable npm packages per domain) may follow in a later phase; this feature focuses on behavioral and folder boundaries compatible with future extraction.
- The team values gradual evolution: some modules may remain pre-alignment until touched, as long as new work does not deepen anti-patterns.
