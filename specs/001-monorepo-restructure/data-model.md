# Data Model: Monorepo Restructure

**Phase 1 output** — Entity definitions and relationships.

## Entities

### Task

The core domain object — a time-boxed action item in a user's day.

```typescript
interface Task extends Entity {
  title: string
  size: 'small' | 'medium' | 'large'        // visual size indication
  duration: number                            // planned duration in minutes
  elapsedTime: number                         // actual time spent in minutes
  status: TaskStatus                          // pending | ongoing | paused | done
  scheduledAt: string                         // ISO date string (YYYY-MM-DD)
  tags: TagOption[]                           // categorization labels
  order: number                               // display ordering within a day
  userId: string                              // owner
  synced?: boolean                            // client-side sync flag
  lastSyncedAt?: string                       // ISO datetime
}

type TaskStatus = 'pending' | 'ongoing' | 'paused' | 'done'
```

**MongoDB collection**: `tasks`
**Indexes**: `{ userId: 1, scheduledAt: 1 }`, `{ userId: 1, status: 1 }`

### User

A person using day.party.

```typescript
interface User extends Entity {
  email: string
  username: string
  role: UserRole
}

type UserRole = 'admin' | 'premium' | 'standard'
```

**MongoDB collection**: `users`
**Indexes**: `{ email: 1 }` (unique)

### AuthSession

A temporary record for magic-link login flow.

```typescript
interface AuthSession extends Entity {
  email: string
  sessionId: string
  active: boolean
  createdAt: string       // ISO datetime
}
```

**MongoDB collection**: `auth_sessions`
**Indexes**: `{ sessionId: 1 }` (unique), `{ createdAt: 1 }` (TTL: 15 min)

### AuthToken (JWT payload — not stored in DB)

```typescript
interface AuthToken {
  sessionId: string
  email: string
  userId: string
  role: UserRole
}
```

### TagOption (embedded in Task, not a standalone collection)

```typescript
interface TagOption {
  label: string
  color: string           // hex color
}
```

### Entity (base interface)

```typescript
interface Entity {
  _id?: string
}
```

## Relationships

```
User (1) ──────── (*) Task         via Task.userId
User (1) ──────── (*) AuthSession  via AuthSession.email → User.email
AuthSession (1) ── (1) AuthToken   via AuthToken.sessionId → AuthSession.sessionId
Task (*) ──embed── (*) TagOption   embedded array in Task.tags
```

## Data Flow

```
Login:  email → AuthSession(created) → magic-link email → verify → AuthSession(active) → JWT signed → AuthToken
Tasks:  AuthToken(from JWT) → userId → Task[] query by userId + scheduledAt
Sync:   mobile sends Task[] → API upserts by _id → returns synced Task[]
```
