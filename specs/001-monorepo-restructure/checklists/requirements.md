# Requirements Checklist — 001 Monorepo Restructure

## Functional Requirements

- [ ] **FR-001**: Monorepo builds all packages via `pnpm build` from root
- [ ] **FR-002**: `@dayparty/core` exports all shared types
- [ ] **FR-003**: `@dayparty/domain` exports business logic with DI parameters
- [ ] **FR-004**: `@dayparty/domain` defines repository and service interfaces
- [ ] **FR-005**: `@dayparty/db` provides MongoDB implementations of all repo interfaces
- [ ] **FR-006**: `@dayparty/validation` exports Zod schemas for task and auth
- [ ] **FR-007**: `@dayparty/api-client` provides typed fetch-based HTTP client
- [ ] **FR-008**: Hono API exposes all existing server actions as REST endpoints
- [ ] **FR-009**: NativeScript app launches on iOS and Android
- [ ] **FR-010**: NativeScript app implements login, rundown, and ongoing screens
- [ ] **FR-011**: Existing web app preserved in `apps/web-legacy/`
- [ ] **FR-012**: Minimal React + TS web client exists in `apps/web/`
- [ ] **FR-013**: Turborepo configured with build, dev, and clean pipelines

## Success Criteria

- [ ] **SC-001**: Fresh `pnpm install && pnpm build` completes without errors in <60s
- [ ] **SC-002**: All five packages produce `dist/` with `.d.ts` declarations
- [ ] **SC-003**: Hono API starts and responds to health check within 2s
- [ ] **SC-004**: Full auth flow works end-to-end via curl
- [ ] **SC-005**: `ns run ios` launches app showing login screen
- [ ] **SC-006**: Minimal web client renders today's tasks
- [ ] **SC-007**: No package imports from any app (dependency direction enforced)

## User Stories

- [ ] **US-1** (P1): Developer runs `pnpm install && pnpm build` from root successfully
- [ ] **US-2** (P2): API serves task and auth endpoints
- [ ] **US-3** (P3): NativeScript app launches and shows login screen
- [ ] **US-4** (P4): Mobile app shows task list for current day
- [ ] **US-5** (P5): Minimal web client displays tasks
