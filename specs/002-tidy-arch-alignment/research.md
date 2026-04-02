# Research: 002-tidy-arch-alignment

Phase 0 consolidation. Resolves planning choices for monorepo layout, API env typing, composition module shape, and testing taxonomy.

---

## 1. Monorepo ↔ reference pod mapping

**Decision**: Treat Tidy “layers” as **logical** boundaries implemented across **`packages/` + `apps/`**, not as a single `pod/` folder. Document a fixed mapping (see `plan.md` Technical Context table): `pod/core` → `@dayparty/core` + `@dayparty/domain`; `pod/adapters` → `apps/api` (Hono) + `apps/web` / `apps/mobile`; `pod/config` + bin → `apps/api` startup (`index.ts` + optional helper); `lib/mongodb` → `@dayparty/db`; Zod at edge → `@dayparty/validation`.

**Rationale**: FR-001 explicitly allows packages instead of one tree; constitution already describes the same package roles. This preserves Turborepo boundaries and future pod extraction without a disruptive physical rename.

**Alternatives considered**:

- **Restructure apps/api into `pod/core|adapters|config` folders** — Rejected for this feature: high churn, little gain; mapping doc + incremental refactors satisfy spec with lower risk.
- **One package per future pod prematurely** — Rejected: constitution warns against premature extraction; current scope is behavioral alignment.

---

## 2. Typing `ApiEnv` with domain ports vs concrete Mongo repositories

**Decision**: **`ApiEnv` SHOULD declare repository fields using `@dayparty/domain` interfaces** (`TaskRepository`, `UserRepository`, `SessionRepository`, `TagRepository`). Concrete `Mongo*` classes are constructed only in `apps/api/src/index.ts` and passed in; TypeScript structural typing ensures implementations satisfy ports.

**Rationale**: Domain actions already depend on ports; wiring is already correct at runtime. Typing `ApiEnv` with `Mongo*` leaks infrastructure into the adapter’s type surface and weakens FR-002/FR-003 review signals (routes can accidentally depend on Mongo-only methods—none today, but the type would allow it). Ports keep the adapter honest and match the reference’s “core depends on interfaces, lib implements” pattern.

**Alternatives considered**:

- **Keep `Mongo*` in `ApiEnv` for “convenience”** — Rejected: violates spirit of FR-003 and obscures the port boundary in code review.
- **Introduce a separate `Ports` type and a parallel `MongoEnv` for tests** — Rejected as YAGNI; fakes can implement the same domain interfaces for tests.

---

## 3. Formal `apps/api` composition module vs `index.ts` only

**Decision**: **Keep `index.ts` as the primary composition root** for now; **optional** extract a small module (e.g. `apps/api/src/build-env.ts` or `composition/create-api-env.ts`) if `index.ts` grows beyond ~50–80 lines or multiple entrypoints appear. Extraction should only move **wiring** (construct repos, call `make*Action`), not domain logic.

**Rationale**: Manifesto and constitution favor **simple, explicit** DI; current `index.ts` is already readable. A separate module is justified when duplication or test harnesses need a shared builder—not as a default layer.

**Alternatives considered**:

- **Mandatory `composition/` package** — Rejected: extra indirection for a single server entrypoint.
- **Lazy singletons / service locator** — Rejected: conflicts with FR-004 and explicit wiring.

---

## 4. Testing taxonomy: domain vs API

**Decision**:

| Layer                         | What                                              | Depends on                                                           | Examples                                                                                        |
| ----------------------------- | ------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Core / domain**             | Actions, pure rules, port-driven behavior         | `@dayparty/domain` + fake/in-memory repos; **no** Hono, **no** Mongo | Tests alongside `packages/domain` (or colocated `*.test.ts`) calling `makeXAction(fakeRepo, …)` |
| **API / adapter integration** | Routes, middleware, serialization, status mapping | Hono app from `createApp` with test doubles or test DB               | Tests under `apps/api` hitting `app.request()` or supertest-style helpers                       |
| **DB adapter (optional)**     | Mongo repository behavior                         | Test container or integration DB                                     | Sparse, for complex queries; not required for every slice                                       |

**Rationale**: Matches reference intent (fast core tests vs integration) and SC-003 (“at least one core-level automated test” per slice without mandating a specific framework). Constitution’s “prioritize integration tests when both are an option” applies to **product** features; this spec **adds** a minimum core test bar per aligned slice—both are satisfied by choosing core tests for rules and one integration test when the slice touches HTTP.

**Alternatives considered**:

- **E2E-only** — Rejected: fails SC-003 and weakens safe refactoring of domain rules.
- **Mandatory test DB for every change** — Rejected: too heavy for a small team; use targeted integration tests.
