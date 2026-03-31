# Contract: API Routes

All routes are prefixed with `/api`. JSON request/response bodies.

## Auth Routes

### `POST /api/auth/login`

**Auth**: None
**Body**: `{ "email": string }`
**Validation**: `loginEmailSchema` (valid email format)
**Response 200**: `{ "sessionId": string, "message": "Check your email" }`
**Response 400**: `{ "error": "Invalid email" }`
**Side effect**: Creates AuthSession, sends magic-link email (or logs in dev mode)

### `POST /api/auth/verify`

**Auth**: None
**Body**: `{ "sessionId": string }`
**Response 200**: `{ "token": string }` (JWT)
**Response 404**: `{ "error": "Session not found or expired" }`
**Side effect**: Marks session active, creates/finds User, signs JWT

### `POST /api/auth/logout`

**Auth**: Bearer JWT
**Response 200**: `{ "message": "Logged out" }`
**Side effect**: Deletes auth session

## Task Routes

### `GET /api/tasks?date=YYYY-MM-DD`

**Auth**: Bearer JWT
**Query**: `date` (optional, defaults to today)
**Response 200**: `{ "tasks": Task[] }`

### `POST /api/tasks`

**Auth**: Bearer JWT
**Body**: Task creation payload (validated by `taskCreateSchema`)
**Response 201**: `{ "task": Task }`

### `PATCH /api/tasks/:id`

**Auth**: Bearer JWT
**Body**: Partial task update (validated by `taskUpdateSchema`)
**Response 200**: `{ "task": Task }`
**Response 404**: `{ "error": "Task not found" }`

### `DELETE /api/tasks/:id`

**Auth**: Bearer JWT
**Response 200**: `{ "message": "Deleted" }`

### `DELETE /api/tasks?date=YYYY-MM-DD`

**Auth**: Bearer JWT
**Query**: `date` (required)
**Response 200**: `{ "deleted": number }`

### `POST /api/tasks/sync`

**Auth**: Bearer JWT
**Body**: `{ "tasks": Task[] }`
**Response 200**: `{ "tasks": Task[] }` (server state after sync)

## Admin Routes

### `GET /api/admin/users?q=search`

**Auth**: Bearer JWT (admin role)
**Query**: `q` (search string)
**Response 200**: `{ "users": User[] }`

### `PATCH /api/admin/users/:id/role`

**Auth**: Bearer JWT (admin role)
**Body**: `{ "role": UserRole }`
**Response 200**: `{ "user": User }`

### `POST /api/admin/auth-as/:id`

**Auth**: Bearer JWT (admin role)
**Response 200**: `{ "token": string }` (JWT for target user)

## Health

### `GET /api/health`

**Auth**: None
**Response 200**: `{ "status": "ok", "timestamp": string }`

## Error Format

All errors follow: `{ "error": string, "details"?: unknown }`

HTTP status codes: 400 (validation), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error), 503 (db unavailable)
