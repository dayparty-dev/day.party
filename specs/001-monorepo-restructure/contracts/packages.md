# Contract: Shared Packages

Public API surface for each package in `packages/`.

## @dayparty/core

Zero dependencies. Types and constants only.

```typescript
// Models
export { Entity } from './models/entity'
export { Task, TaskStatus } from './models/task'
export { User, UserRole } from './models/user'
export { TagOption } from './models/tag'

// Auth
export { AuthSession } from './auth/session'
export { AuthToken } from './auth/token'
export { AuthTokenJwt } from './auth/token-jwt'
export { AuthTokenSigningInput } from './auth/signing-input'
export { AuthTokenVerificationInput } from './auth/verification-input'

// Email
export { EmailMessage } from './email/message'
export { EmailSendInput } from './email/send-input'

// Constants
export { CookieName } from './constants/cookies'

// Patterns
export { Interactor } from './patterns/interactor'
```

**Dependencies**: none
**Consumers**: all other packages and all apps

---

## @dayparty/domain

Business logic, repository interfaces, service interfaces. Pure TypeScript.

```typescript
// Repository interfaces
export { AuthSessionRepo } from './repos/auth-session-repo'
export { UserRepo } from './repos/user-repo'
export { TaskRepo } from './repos/task-repo'

// Service interfaces
export { AuthTokenService } from './services/auth-token-service'
export { EmailService } from './services/email-service'
export { UserService } from './services/user-service'

// Interactors (business logic)
export { createAuthSession } from './interactors/create-auth-session'
export { verifyAuthSession } from './interactors/verify-auth-session'
export { deleteAuthSession } from './interactors/delete-auth-session'
export { authenticateOtherUser } from './interactors/authenticate-other-user'

// Utils
export { groupTasksByDate, sortTasksByOrder } from './utils/tasks'
```

**Repository interface shapes:**

```typescript
interface AuthSessionRepo {
  create(session: Omit<AuthSession, '_id'>): Promise<AuthSession>
  findBySessionId(sessionId: string): Promise<AuthSession | null>
  markActive(sessionId: string): Promise<void>
  delete(sessionId: string): Promise<void>
}

interface UserRepo {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(user: Omit<User, '_id'>): Promise<User>
  updateRole(id: string, role: UserRole): Promise<User>
  search(query: string): Promise<User[]>
}

interface TaskRepo {
  findByUserAndDate(userId: string, date: string): Promise<Task[]>
  findByUser(userId: string): Promise<Task[]>
  create(task: Omit<Task, '_id'>): Promise<Task>
  update(id: string, updates: Partial<Task>): Promise<Task>
  delete(id: string): Promise<void>
  deleteByUserAndDate(userId: string, date: string): Promise<number>
  bulkSync(userId: string, tasks: Task[]): Promise<Task[]>
}
```

**Interactor signature pattern:**

```typescript
// Each interactor is a function that takes dependencies + input, returns output
type CreateAuthSession = (
  deps: { authSessionRepo: AuthSessionRepo; emailService: EmailService },
  input: { email: string }
) => Promise<{ sessionId: string }>
```

**Dependencies**: `@dayparty/core`
**Consumers**: `@dayparty/db`, `apps/api`, `apps/web-legacy` (if adapted)

---

## @dayparty/db

MongoDB implementations of repository interfaces.

```typescript
export { createMongoConnection, getDb } from './connection'
export { MongoAuthSessionRepo } from './repos/mongo-auth-session-repo'
export { MongoUserRepo } from './repos/mongo-user-repo'
export { MongoTaskRepo } from './repos/mongo-task-repo'
```

**Dependencies**: `@dayparty/core`, `@dayparty/domain`, `mongodb`
**Consumers**: `apps/api`

---

## @dayparty/validation

Zod schemas for input validation at system boundaries.

```typescript
export { loginEmailSchema } from './auth'              // { email: string }
export { taskCreateSchema, taskUpdateSchema } from './task'  // Task input shapes
```

**Dependencies**: `@dayparty/core`, `zod`
**Consumers**: `apps/api`, `apps/web`, `apps/mobile`

---

## @dayparty/api-client

Typed HTTP client for consuming the Hono API.

```typescript
export { createApiClient } from './client'
export type { ApiClient, ApiConfig, ApiResponse, ApiError } from './types'

// ApiClient shape:
interface ApiClient {
  auth: {
    login(email: string): Promise<{ sessionId: string }>
    verify(sessionId: string): Promise<{ token: string }>
    logout(): Promise<void>
  }
  tasks: {
    list(date?: string): Promise<Task[]>
    create(task: TaskCreateInput): Promise<Task>
    update(id: string, updates: Partial<Task>): Promise<Task>
    delete(id: string): Promise<void>
    deleteByDate(date: string): Promise<number>
    sync(tasks: Task[]): Promise<Task[]>
  }
  admin: {
    searchUsers(query: string): Promise<User[]>
    updateRole(userId: string, role: UserRole): Promise<User>
    authAs(userId: string): Promise<{ token: string }>
  }
}

// Configuration:
interface ApiConfig {
  baseUrl: string
  getToken: () => string | null    // platform-specific token retrieval
}
```

**Dependencies**: `@dayparty/core`
**Consumers**: `apps/mobile`, `apps/web`
