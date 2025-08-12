## day.party — Project Context for LLMs

This document provides a concise yet detailed architecture overview to help LLMs work effectively on this codebase. It explains structure, data models, state, auth, server actions, and key flows.

### Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19, TypeScript
- **UI**: Tailwind CSS v4 + DaisyUI (themes defined in `app/styles/global.css`)
- **State**: Zustand stores (`useTaskStore`, `useTagStore`); a legacy `useAuthStore` exists but the app primarily uses `useAuth`
- **i18n**: `next-i18next` + a local `i18next` init (`app/i18n.ts`)
- **DB**: MongoDB via official driver (`lib/mongodb.ts`)
- **Auth**: Passwordless magic-link email flow; JWTs signed with `jsonwebtoken` stored in cookies
- **Email**: Resend (`ResendEmailService`) or console fallback (`FakeEmailService`)

### Project Layout (key areas)

- `app/`
  - `layout.tsx`: Root layout: mounts `ToastContainer`, `ThemeSwitcher`, `LangBubble`, and `ClientInitializer`
  - `page.tsx`: Marketing/landing page
  - `rundown/`: Main task management UI
    - `page.tsx`: Orchestrates day navigation, capacity, and task list
    - `components/`: Task CRUD, DnD, PiP, calendar, etc.
    - `hooks/`: Task UX helpers (`useTaskHandlers`, `useTaskIndicators`, `useTaskUtils`, `useDndSensors`)
  - `ongoing/page.tsx`: Focused view for the current/next task with a time slider
  - `auth/`
    - `_hooks/`: `useAuth`, `useAuthGuard`, server `authActions`
    - `_interactors/`: Create/verify/delete auth sessions
    - `_middleware/withAuth.ts`: Secures server actions (injects auth context)
    - `_models/`: Auth token shapes
    - `_services/`: JWT service wrapper
    - `_utils/serverAuth.ts`: Server helpers to read/verify cookie token
    - `login/page.tsx`: Magic-link login; verifies `sessionId` param
    - `logout/page.tsx`: Calls logout and redirects
  - `_actions/`: Server actions (Mongo-backed)
    - `tasks.ts`: CRUD + sync for tasks, all wrapped with `withAuth`
    - `userActions.ts`: Admin-only actions (search, role updates, auth-as)
    - `feedbackActions.ts`: Example POST to `/api/feedback`
  - `_models/`: App-level models (`Task`, `Entity`, mail models)
  - `_services/`: Cookie utils, email service, server-side cookie access
  - `_stores/`: Zustand stores for tasks and tags
  - `_hooks/`: App helpers (`useTasks`, `useTags`, `useAppTranslation`)
  - `styles/global.css`: Tailwind + DaisyUI themes `latte` and `coffee`
- `lib/mongodb.ts`: Connection helpers (`getDb`, `getCollection`)
- `public/locales/`: i18n resource files (`en`, `es`)

### Data Models (representative)

- `Task` (`app/_models/Task.ts`)
  - `_id: string`
  - `title: string`, `size: number`, `tagKey?: string`
  - `duration: number` (minutes, computed as `size * 15` on creation), `elapsed: number`
  - `status: 'ongoing' | 'paused' | 'pending' | 'done'`
  - Timestamps: `createdAt`, `updatedAt`, `scheduledAt`, `deletedAt?`
  - Ordering: `order: number`
  - Sync flags: `isDirty?`, `isSynced?`, `lastSyncedAt?`
  - `userId: string`
- `User` (`app/user/_models/User.ts`)
  - Extends `Entity` with `_id`, `_createdAt`, `_updatedAt`
  - `email`, `username`, `role: UserRole` (`admin | premium | standard`)
- Auth models
  - `AuthTokenJwt`: JWT payload (includes `sessionId`, `email`, `userId`, `role?`)
  - `AuthSession`: Stored in `auth_sessions` during magic-link flow

### State Management

- `useTaskStore` (`app/_stores/useTaskStore.ts`)
  - `tasksByDate: Record<dateKey, Task[]>` where `dateKey` is midnight timestamp string
  - `currentDate`, `currentDayTasks`, `dayCapacity`, `totalMinutes`, `deletedTasks`
  - Actions: `initialize`, `setCurrentDate`, `setDayCapacity`, `setTasks`, `addTask`, `updateTask`, `deleteTask`, `deleteAllDayTasks`, `setCurrentDayTasks`, `calculateTotalMinutes`, `syncTasks`
  - Cloud sync gated by `NEXT_PUBLIC_IS_CLOUD_SYNC_ENABLED === 'true'`
  - Sorting prioritizes `ongoing`, then `pending/paused`, then `done` by `order`
- `useTagsStore` (`app/_stores/useTagStore.ts`)
  - Default tags + `customTags`, CRUD helpers, and lookups
- `useAuthStore` (`app/auth/_store/useAuthStore.ts`)
  - Legacy Zustand-based auth (cookie name differs); current flow favors `useAuth` hook

### Hooks

- `useTasks` aggregates store selectors and utilities; memoizes “days-with-tasks-in-month-range”
- `useTags` wraps `useTagStore`
- `useAuth`
  - Persists minimal state with `use-persisted-state`
  - Reads/writes JWT cookie via `clientCookies` (`CookieName.AuthToken`)
  - Server actions used: `createAuthSessionServer`, `verifyAuthSessionServer`, `deleteAuthSessionServer`
- `useAuthGuard`
  - Client-only guard wrapper for elements; redirects based on login state

### Auth Flow (magic link + JWT)

1. User enters email on `auth/login`.
2. Server action `createAuthSessionServer` invokes `CreateAuthSessionInteractor`:
   - Creates `auth_sessions` record with `_id = nanoid()`, `isActive = false`
   - Sends email via `EmailService` with link: `BASE_URL/auth/login?sessionId=<id>`
3. On visiting the link, `LoginPage` reads `sessionId` and calls `verifyAuthSessionServer`:
   - `VerifyAuthSessionInteractor` checks session, finds/creates `User`, marks session active, signs JWT via `JsonWebTokenAuthTokenService` using `JWT_SECRET` and `JWT_EXPIRATION_TIME_SECS`
   - The client sets cookie `CookieName.AuthToken = 'dayparty:auth_token'`
4. Logout calls `deleteAuthSessionServer` → `DeleteAuthSessionInteractor` removes session; client clears cookie
5. Server actions use `withAuth` to read the cookie (`serverCookies.get`) and verify JWT to inject `ctx.auth`

### Server Actions and DB Access

- All sensitive actions are wrapped by `withAuth` (`app/auth/_middleware/withAuth.ts`). It:
  - Reads token from cookies (`serverCookieService.ts`)
  - Verifies via `JsonWebTokenAuthTokenService`
  - Injects `ctx.auth = { userId, email, role }`
- Tasks (`app/_actions/tasks.ts`):
  - `fetchTasksServer`: `find({ userId })`
  - `addTaskServer`: inserts task with current `userId`
  - `updateTaskServer`: guarded `updateOne({ _id, userId })`
  - `deleteTaskServer`: guarded `deleteOne({ _id, userId })`
  - `deleteAllDayTasksServer`: deletes by normalized `scheduledAt` and `userId`
  - `syncTasksToServer`: bulk upsert dirty tasks; delete those with `deletedAt`
- Users (`app/user/_services/UserService.ts`): search/update role; admin-only actions in `app/_actions/userActions.ts`
- DB (`lib/mongodb.ts`): simple cached connection, `getCollection<T>(name)` helper

### UI Highlights

- `rundown/page.tsx`: main task planner; toggles edit mode to show `TaskForm` and enables interactive `TaskList`
- `ongoing/page.tsx`: focuses on the current task; `TimeSlider` can adjust `duration` and mark as `done`
- `app/layout.tsx`: mounts the global utilities and UI chrome

### i18n

- `next-i18next.config.js`: `defaultLocale: 'en'`, `locales: ['en','de']`
- `app/i18n.ts`: initializes `i18next` with `en` and `es` using files in `public/locales/en/common.json` and `public/locales/es/common.json`
- Note: There is a mismatch between config locales (`de`) and resources (`es`). If SSR/i18n issues arise, align these.

### Styling

- Tailwind v4 + DaisyUI are configured in `app/styles/global.css`
- Two themes: `latte` (light) and `coffee` (dark) with CSS variables for semantic colors

### Environment Variables

- `MONGODB_URI`: Mongo connection string (required)
- `JWT_SECRET`, `JWT_EXPIRATION_TIME_SECS`: JWT signing and TTL (required for auth)
- `EMAIL_RESEND_API_KEY`, `EMAIL_SENDER_ADDRESS`: enable real email via Resend; otherwise `FakeEmailService` logs emails
- `BASE_URL` or `VERCEL_PROJECT_PRODUCTION_URL`: base to generate magic link URLs
- `NEXT_PUBLIC_IS_CLOUD_SYNC_ENABLED`: `'true'` to enable client-server task sync

### Common Flows for LLMs

- Add a new server action that requires auth:
  1. Implement as an async function in `app/_actions/...` 2) Wrap with `withAuth(async (ctx, ...args) => { ... })` 3) Use `ctx.auth.userId`
- Create a new collection-backed service:
  1. Add a class in `app/.../_services` 2) Use `getCollection<T>('name')` 3) Export a factory like `getXService()`
- Extend `Task` or introduce fields:
  1. Update `app/_models/Task.ts` 2) Adjust `useTaskStore` create/update/sync paths 3) Update UI props in `rundown/components`
- Add translations:
  1. Update `public/locales/<lang>/common.json` 2) Ensure the language exists in both `next-i18next.config.js` and `app/i18n.ts`

### Notable Inconsistencies to Be Aware Of

- i18n locales discrepancy: `de` in config vs `es` in runtime resources
- `useAuthStore` uses cookie name `day_party_auth_token`; current flow uses `CookieName.AuthToken = 'dayparty:auth_token'`. Treat `useAuthStore` as legacy unless explicitly used.

### Run/Build

- Dev: `pnpm dev`
- Build: `pnpm build` → `pnpm start`

### Quick References (files)

- Auth
  - `app/auth/_interactors/CreateAuthSessionInteractor.ts`
  - `app/auth/_interactors/VerifyAuthSessionInteractor.ts`
  - `app/auth/_interactors/DeleteAuthSessionInteractor.ts`
  - `app/auth/_middleware/withAuth.ts`
  - `app/auth/_services/JsonWebTokenAuthTokenService.ts`
  - `app/auth/_hooks/authActions.ts`, `useAuth.ts`, `useAuthGuard.tsx`
- Tasks
  - `app/_actions/tasks.ts`, `app/_stores/useTaskStore.ts`, `app/_hooks/useTasks.ts`
  - UI: `app/rundown/components/*`, `app/ongoing/page.tsx`
- Infra
  - `lib/mongodb.ts`, `app/_services/*`, `app/styles/global.css`

This document is intended to be stable context for future LLM work. Update as architecture evolves.
