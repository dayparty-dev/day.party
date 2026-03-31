# Contract: Mobile Screens

NativeScript 9 app screens — XML layouts + TypeScript code-behind.

## Navigation Flow

```
app-root.xml (Frame)
  └─ login-page  ──(auth success)──→  rundown-page  ──(tap ongoing task)──→  ongoing-page
                                        ↑                                        │
                                        └────────────(complete/back)─────────────┘
```

Login → Rundown uses `clearHistory: true` (no back to login).
Rundown → Ongoing uses standard push/pop navigation.

## Screen 1: Login (`views/login/`)

**Purpose**: Email-based magic-link authentication.

**Layout** (`login-page.xml`):
- StackLayout centered vertically
- Logo/app name label
- TextField (email input, keyboard type: email)
- Button "Send magic link"
- Label (status message: "Check your email" or error)

**Code-behind** (`login-page.ts`):
- Uses `@dayparty/api-client` → `auth.login(email)`
- On success: shows "Check your email" message
- Verification: secondary input for session ID (MVP — no deep links)
- On verify success: stores JWT via `auth-service.ts`, navigates to rundown

**State**: email string, isLoading boolean, message string, showVerify boolean

## Screen 2: Rundown (`views/rundown/`)

**Purpose**: Day's task list — the primary screen.

**Layout** (`rundown-page.xml`):
- ActionBar with date title + prev/next day buttons
- ProgressBar (day capacity: total elapsed / total duration)
- ListView of tasks for the selected date
  - Each item: title, duration badge, status indicator, tag colors
- FAB or ActionBar button to add task

**Code-behind** (`rundown-page.ts`):
- Uses `@dayparty/api-client` → `tasks.list(date)`
- Day navigation: changes date string, refetches tasks
- Tap task → if pending, start (status → ongoing, navigate to ongoing page)
- Tap task → if ongoing, navigate to ongoing page
- Add task: modal/dialog with title + duration input
- Capacity: sum of durations vs sum of elapsed, shown as progress bar

**State**: tasks Task[], currentDate string, isLoading boolean

## Screen 3: Ongoing (`views/ongoing/`)

**Purpose**: Active task timer view.

**Layout** (`ongoing-page.xml`):
- ActionBar with back button
- Card (centered):
  - Task title label
  - Timer label (MM:SS elapsed)
  - Tag badges
- Button row: Pause / Complete

**Code-behind** (`ongoing-page.ts`):
- Receives task via navigation context
- Timer: `setInterval(1000)` incrementing elapsed seconds
- Pause: updates task status to "paused", navigates back
- Complete: updates task status to "done", navigates back
- Updates via `@dayparty/api-client` → `tasks.update(id, { status, elapsedTime })`

**State**: task Task, elapsedSeconds number, timerRef number

## Shared Services

### auth-service.ts
- `getToken(): string | null` — reads JWT from SecureStorage
- `setToken(token: string): void` — writes JWT to SecureStorage
- `clearToken(): void` — removes JWT
- `isAuthenticated(): boolean` — checks if token exists and not expired

### task-service.ts
- Thin wrapper over `@dayparty/api-client` tasks
- Adds local caching via `ApplicationSettings` for offline resilience
- `fetchTasks(date)`, `createTask(input)`, `updateTask(id, updates)`

### navigation.ts
- `navigateTo(page: string, context?: any, clearHistory?: boolean)`
- Wraps `Frame.topmost().navigate()`
