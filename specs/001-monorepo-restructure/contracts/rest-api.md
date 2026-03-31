# REST API Contract: Monorepo Restructure

**Feature**: 001-monorepo-restructure
**Date**: 2026-03-31
**Base URL**: `http://localhost:3001/api` (development)
**Auth**: Bearer token in `Authorization: Bearer <token>` header

---

## Authentication

### POST /auth/login

Request a magic-link login email.

**Request**:

```json
{ "email": "user@example.com" }
```

**Response 200**:

```json
{ "message": "Magic link sent" }
```

**Errors**: 422 (invalid email)

---

### GET /auth/verify?token={token}

Verify a magic-link token and create a session.

**Response 200**:

```json
{
  "token": "eyJhbG...",
  "user": {
    "id": "abc123",
    "email": "user@example.com",
    "displayName": "Santi",
    "role": "user"
  }
}
```

**Errors**: 401 (invalid/expired token)

---

### POST /auth/logout

Destroy the current session.

**Headers**: `Authorization: Bearer <token>` (required)

**Response 200**:

```json
{ "message": "Logged out" }
```

**Errors**: 401 (unauthorized)

---

### GET /auth/me

Validate current session and return user info. _(Implements FR-008 session validation.)_

**Headers**: `Authorization: Bearer <token>` (required)

**Response 200**:

```json
{
  "id": "abc123",
  "email": "user@example.com",
  "displayName": "Santi",
  "role": "user"
}
```

**Errors**: 401 (unauthorized)

---

## Tasks

All task endpoints require `Authorization: Bearer <token>`.

### GET /tasks?date={YYYY-MM-DD}

Get the user's task rundown for a specific date.

**Query**: `date` (required, ISO 8601 date)

**Response 200**:

```json
{
  "date": "2026-03-31",
  "tasks": [
    {
      "id": "task1",
      "title": "Morning exercise",
      "size": 2,
      "tagKey": "health",
      "isComplete": false,
      "scheduledDate": "2026-03-31",
      "position": 0,
      "createdAt": "2026-03-30T10:00:00Z",
      "updatedAt": "2026-03-30T10:00:00Z"
    }
  ],
  "capacity": 12,
  "completed": 3
}
```

> **Note**: `userId` (present in the internal DayRundown model per data-model.md) is omitted from the response — it is always the authenticated user.

**Errors**: 401, 422 (invalid date)

---

### POST /tasks

Create a new task.

**Request**:

```json
{
  "title": "Morning exercise",
  "size": 2,
  "tagKey": "health",
  "scheduledDate": "2026-03-31"
}
```

`position` is auto-assigned (appended to end of day). `tagKey` is optional.

**Response 201**:

```json
{
  "id": "task1",
  "title": "Morning exercise",
  "size": 2,
  "tagKey": "health",
  "isComplete": false,
  "scheduledDate": "2026-03-31",
  "position": 5,
  "createdAt": "2026-03-31T08:00:00Z",
  "updatedAt": "2026-03-31T08:00:00Z"
}
```

**Errors**: 401, 422 (validation: title required, size 1–5, invalid tagKey, invalid date)

---

### PATCH /tasks/:id

Update a task's fields. Partial update — only provided fields are changed.

**Request** (any combination):

```json
{
  "title": "Updated title",
  "size": 3,
  "tagKey": "work",
  "isComplete": true,
  "scheduledDate": "2026-04-01"
}
```

**Response 200**: The full updated task object (same shape as POST response).

**Errors**: 401, 404 (task not found or not owned), 422 (validation)

---

### DELETE /tasks/:id

Delete a task. Positions of remaining tasks on that day are compacted.

**Response 200**:

```json
{ "message": "Deleted" }
```

**Errors**: 401, 404

---

### PATCH /tasks/reorder

Reorder tasks within a single day.

**Request**:

```json
{
  "date": "2026-03-31",
  "taskIds": ["task3", "task1", "task2"]
}
```

`taskIds` is the full ordered list of task IDs for that date. All tasks for the date must be included.

**Response 200**:

```json
{
  "date": "2026-03-31",
  "tasks": [
    /* full task objects in new order */
  ],
  "capacity": 12,
  "completed": 3
}
```

**Errors**: 401, 422 (missing tasks, extra tasks, invalid date)

---

## Tags

All tag endpoints require `Authorization: Bearer <token>`.

### GET /tags

Get all tags for the authenticated user.

**Response 200**:

```json
[
  {
    "id": "tag1",
    "key": "work",
    "displayName": "Work",
    "color": "#4A90D9",
    "icon": "💼",
    "isDefault": true,
    "createdAt": "2026-03-01T00:00:00Z"
  }
]
```

---

### POST /tags

Create a custom tag.

**Request**:

```json
{
  "key": "gaming",
  "displayName": "Gaming",
  "color": "#9B59B6",
  "icon": "🎮"
}
```

`color` and `icon` are optional.

**Response 201**: Full tag object.

**Errors**: 401, 409 (duplicate key), 422 (validation)

---

### PATCH /tags/:id

Update a tag's display properties.

**Request** (any combination):

```json
{
  "displayName": "Updated Name",
  "color": "#E74C3C",
  "icon": "🔥"
}
```

`key` is immutable after creation.

**Response 200**: Full updated tag object.

**Errors**: 401, 404, 422

---

### DELETE /tags/:id

Delete a tag. Tasks referencing this tag have their `tagKey` set to null.

**Response 200**:

```json
{ "message": "Deleted" }
```

**Errors**: 401, 404

---

## Error Response Shape

All error responses follow this shape:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid input",
  "fields": {
    "title": ["Required"],
    "size": ["Must be between 1 and 5"]
  }
}
```

| HTTP Status | Code             | When                                          |
| ----------- | ---------------- | --------------------------------------------- |
| 401         | UNAUTHORIZED     | Missing/invalid/expired bearer token          |
| 403         | FORBIDDEN        | Authenticated but insufficient permissions    |
| 404         | NOT_FOUND        | Resource doesn't exist or isn't owned by user |
| 409         | CONFLICT         | Duplicate resource (e.g., tag key)            |
| 422         | VALIDATION_ERROR | Request body/params failed Zod validation     |
| 500         | INTERNAL_ERROR   | Unexpected server error                       |
