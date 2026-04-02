# Contract: architecture checklist (binary per slice)

**Feature**: 002-tidy-arch-alignment  
**Purpose**: Satisfy **SC-002** — for each agreed domain slice, verify FR-002–FR-005 with a short pass/fail checklist.  
**Audience**: PR author + reviewer.

## How to use

- Apply to **one domain slice** per review (e.g. tasks, tags, auth).
- Each item is **Pass** or **Fail**. Any **Fail** must be fixed or explicitly out of scope with a follow-up tracked.

## Checklist

| ID  | Requirement                                           | Pass criteria                                                                                                                          |
| --- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **FR-002** Domain free of transport/framework imports | `@dayparty/domain` and `@dayparty/core` have no imports from `hono`, `react`, `@nativescript/*`, etc.                                  |
| C2  | **FR-003** Persistence via ports                      | New/refactored domain code uses `@dayparty/domain` repository interfaces; no direct Mongo driver / collection types in domain or core. |
| C3  | **FR-004** Explicit wiring                            | Dependencies for the slice are constructed in the API composition root (or documented helper), not read from hidden singletons.        |
| C4  | **FR-005** Edge validation                            | Zod (or agreed edge validator) runs in adapter layer for HTTP bodies/params where applicable; domain handles domain rules only.        |
| C5  | **SC-003** Core test                                  | At least one automated test runs domain behavior without starting the real HTTP server (fake/in-memory ports OK).                      |

## API stability (informal)

This alignment feature does not define OpenAPI changes. **Product** HTTP contract changes remain intentional and separate from this checklist. If a slice changes public JSON or status codes, document that in the PR as usual.

## Mapping reference

Canonical **reference concept → package** table: `/Users/santi/dev/day.party/specs/002-tidy-arch-alignment/plan.md` (Technical Context).
