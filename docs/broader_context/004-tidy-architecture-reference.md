# Tidy Architecture Reference Implementation

_A practical guide for implementing the Tidy Architecture principles using the Pod pattern_

## Overview

This document provides a concrete reference implementation that combines:

- **Tidy Architecture principles** (from the manifesto)
- **Pod-based organization** (self-contained domain modules)
- **Pragmatic patterns** (battle-tested, simple solutions)
- **Gradual evolution strategy** (start simple, evolve when needed)

## Project Structure

### Phase 1: Single Pod (Current State Evolution)

```
auth-pod/
├── src/
│   ├── pod/                    # Pod-specific code
│   │   ├── core/               # Framework-agnostic business logic
│   │   │   ├── actions/
│   │   │   │   ├── CreateUserAction.ts
│   │   │   │   ├── ListUsersAction.ts
│   │   │   │   └── index.ts
│   │   │   ├── models/
│   │   │   │   ├── User.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/       # Optional: group related actions
│   │   │   │   ├── UserService.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── adapters/           # Framework-specific implementations
│   │   │   ├── express/
│   │   │   │   ├── AuthExpressPod.ts
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── AuthMiddleware.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── request-handlers/
│   │   │   │   │   ├── CreateUserRequestHandler.ts
│   │   │   │   │   ├── ListUsersRequestHandler.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   ├── AuthPodConfig.ts
│   │   │   └── index.ts
│   │   └── index.ts            # Main pod export
│   ├── common/                 # Shared utilities (future: extract to package)
│   │   ├── base/
│   │   │   ├── BasePod.ts
│   │   │   ├── BaseAction.ts
│   │   │   ├── BaseRequestHandler.ts
│   │   │   └── index.ts
│   │   ├── models/
│   │   │   ├── Entity.ts
│   │   │   ├── HttpStatusCode.ts
│   │   │   ├── Request.ts
│   │   │   ├── Response.ts
│   │   │   ├── errors/
│   │   │   │   ├── AppError.ts
│   │   │   │   ├── ValidationError.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── middleware/
│   │   │   ├── ErrorMiddleware.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── lib/                    # External integrations
│   │   ├── mongodb/
│   │   └── index.ts
│   └── bin/                    # Entry points
│       ├── start-server.ts
│       └── seed-dummy-db.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Phase 2: Multi-Pod Setup (Future Evolution)

```
@your-org/pod-common/           # Shared package
├── src/
│   ├── base/
│   ├── models/
│   ├── middleware/
│   └── utils/
└── package.json

@your-org/auth-pod/             # Authentication pod
@your-org/commerce-pod/         # E-commerce pod
@your-org/notifications-pod/    # Notifications pod
```

## Core Implementation Patterns

### 1. Pod Configuration (Tidy Principle: Simple DI)

```typescript
// src/pod/config/AuthPodConfig.ts
export interface AuthPodConfig {
  // Database configuration
  database: {
    connectionUri: string;
    maxConnections?: number;
  };

  // JWT configuration
  jwt: {
    secret: string;
    expiresIn?: string;
  };

  // Feature flags
  features?: {
    emailVerification?: boolean;
    passwordReset?: boolean;
    twoFactor?: boolean;
  };

  // Extension points
  customHandlers?: Record<string, Function>;
  additionalRoutes?: RouteDefinition[];
  middleware?: {
    before?: Function[];
    after?: Function[];
  };

  // External services
  emailService?: {
    provider: 'smtp' | 'sendgrid';
    apiKey?: string;
    fromEmail: string;
  };
}

export interface RouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: Function;
  middleware?: Function[];
}
```

### 2. Base Classes (Tidy Principle: Consistent Patterns)

```typescript
// src/common/base/BaseAction.ts
export abstract class BaseAction<TInput, TOutput> {
  abstract execute(input: TInput): Promise<TOutput>;
}

// src/common/base/BaseRequestHandler.ts
import { z } from 'zod';
import { Request, Response } from '../models';

export abstract class BaseRequestHandler<TInput = any, TOutput = any> {
  protected bodySchema?: z.ZodSchema;
  protected querySchema?: z.ZodSchema;
  protected paramsSchema?: z.ZodSchema;

  public get handler() {
    return this.handleRequest.bind(this);
  }

  protected abstract handle(request: Request<TInput>): Promise<Response<TOutput>>;

  private async handleRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      const request = await this.mapExpressRequest(req);
      const response = await this.handle(request);

      res.status(response.statusCode ?? 200).json(response.body);
    } catch (error) {
      next(error);
    }
  }

  private async mapExpressRequest(req: express.Request): Promise<Request<TInput>> {
    const request: Request<TInput> = {
      headers: req.headers as Record<string, string>,
    };

    // Validate and parse body
    if (this.bodySchema && req.body) {
      request.body = await this.bodySchema.parseAsync(req.body);
    }

    // Validate and parse query params
    if (this.querySchema && req.query) {
      request.query = await this.querySchema.parseAsync(req.query);
    }

    // Validate and parse path params
    if (this.paramsSchema && req.params) {
      request.params = await this.paramsSchema.parseAsync(req.params);
    }

    return request;
  }
}

// src/common/base/BasePod.ts
export abstract class BasePod<TConfig> {
  protected config: TConfig;
  protected customHandlers: Map<string, Function> = new Map();
  protected additionalRoutes: RouteDefinition[] = [];

  constructor(config: TConfig) {
    this.config = config;
    this.setupCustomizations();
  }

  protected abstract setupDependencies(): void;
  protected abstract setupRoutes(): void;

  private setupCustomizations(): void {
    // Setup custom handlers, additional routes, etc.
    // Implementation depends on config structure
  }
}
```

### 3. Core Business Logic (Tidy Principle: Framework-Agnostic)

```typescript
// src/pod/core/actions/CreateUserAction.ts
import { BaseAction } from '../../../common/base/BaseAction';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface CreateUserOutput {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export class CreateUserAction extends BaseAction<CreateUserInput, CreateUserOutput> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly encryptionService: EncryptionService,
    private readonly emailService?: EmailService,
  ) {
    super();
  }

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    // Validate business rules
    await this.validateUserDoesNotExist(input.email);

    // Create user
    const passwordHash = await this.encryptionService.hash(input.password);

    const user: User = {
      id: nanoid(),
      name: input.name,
      email: input.email,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.userRepository.save(user);

    // Optional: Send welcome email
    if (this.emailService) {
      await this.emailService.sendWelcomeEmail(user);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  private async validateUserDoesNotExist(email: string): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }
  }
}

// src/pod/core/services/UserService.ts (Optional: group related actions)
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly encryptionService: EncryptionService,
    private readonly emailService?: EmailService,
  ) {}

  async createUser(input: CreateUserInput): Promise<CreateUserOutput> {
    const action = new CreateUserAction(this.userRepository, this.encryptionService, this.emailService);
    return action.execute(input);
  }

  async listUsers(input: ListUsersInput): Promise<ListUsersOutput> {
    const action = new ListUsersAction(this.userRepository);
    return action.execute(input);
  }
}
```

### 4. Repository Pattern (Tidy Principle: Clear Interfaces)

```typescript
// src/pod/core/repositories/UserRepository.ts
export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(options?: FindAllOptions): Promise<User[]>;
  update(id: string, updates: Partial<User>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface FindAllOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// src/lib/mongodb/repositories/MongoUserRepository.ts
export class MongoUserRepository implements UserRepository {
  constructor(private readonly collection: Collection<User>) {}

  async save(user: User): Promise<void> {
    await this.collection.insertOne(user);
  }

  async findById(id: string): Promise<User | null> {
    return await this.collection.findOne({ _id: id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.collection.findOne({ email });
  }

  async findAll(options: FindAllOptions = {}): Promise<User[]> {
    const { limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    return await this.collection
      .find({})
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
  }

  async update(id: string, updates: Partial<User>): Promise<void> {
    await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
    );
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ _id: id });
  }
}
```

### 5. Express Adapter (Tidy Principle: Framework-Specific Layer)

```typescript
// src/pod/adapters/express/request-handlers/CreateUserRequestHandler.ts
import { z } from 'zod';
import { BaseRequestHandler } from '../../../../common/base/BaseRequestHandler';
import { HttpStatusCode } from '../../../../common/models/HttpStatusCode';
import { CreateUserAction, CreateUserInput, CreateUserOutput } from '../../../core/actions/CreateUserAction';

export class CreateUserRequestHandler extends BaseRequestHandler<CreateUserInput, CreateUserOutput> {
  protected bodySchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
  });

  constructor(private readonly createUserAction: CreateUserAction) {
    super();
  }

  protected async handle(request: Request<CreateUserInput>): Promise<Response<CreateUserOutput>> {
    const user = await this.createUserAction.execute(request.body);

    return {
      body: user,
      statusCode: HttpStatusCode.Created,
    };
  }
}

// src/pod/adapters/express/AuthExpressPod.ts
import { Router } from 'express';
import { BasePod } from '../../../common/base/BasePod';
import { AuthPodConfig } from '../../config/AuthPodConfig';
import { UserService } from '../../core/services/UserService';
import { MongoUserRepository } from '../../../lib/mongodb/repositories/MongoUserRepository';
import { BcryptEncryptionService } from '../../../lib/mongodb/bcrypt/modules/BcryptEncryptionService';

export class AuthExpressPod extends BasePod<AuthPodConfig> {
  private userService: UserService;
  private router: Router;

  constructor(config: AuthPodConfig) {
    super(config);
    this.router = Router();
    this.setupDependencies();
    this.setupRoutes();
  }

  protected setupDependencies(): void {
    // Setup database connection
    const mongoClient = new MongoDbClient(this.config.database.connectionUri);
    const userRepository = new MongoUserRepository(mongoClient.getCollection('users'));

    // Setup services
    const encryptionService = new BcryptEncryptionService();
    const emailService = this.config.emailService ? new EmailService(this.config.emailService) : undefined;

    this.userService = new UserService(userRepository, encryptionService, emailService);
  }

  protected setupRoutes(): void {
    // Setup standard routes
    this.router.post('/users', new CreateUserRequestHandler(new CreateUserAction(/* dependencies */)).handler);

    this.router.get('/users', new ListUsersRequestHandler(new ListUsersAction(/* dependencies */)).handler);

    // Setup custom routes
    this.additionalRoutes.forEach((route) => {
      const method = route.method.toLowerCase() as keyof Router;
      this.router[method](route.path, route.handler);
    });

    // Setup custom handlers (overrides)
    this.customHandlers.forEach((handler, route) => {
      const [method, path] = route.split(' ');
      const routerMethod = method.toLowerCase() as keyof Router;
      this.router[routerMethod](path, handler);
    });
  }

  public getRouter(): Router {
    return this.router;
  }

  // Extension method for additional customization
  public addRoute(method: string, path: string, handler: Function): void {
    const routerMethod = method.toLowerCase() as keyof Router;
    this.router[routerMethod](path, handler);
  }
}
```

### 6. Pod Entry Point (Tidy Principle: Simple Public API)

```typescript
// src/pod/index.ts
export { AuthExpressPod } from './adapters/express/AuthExpressPod';
export { AuthPodConfig, RouteDefinition } from './config/AuthPodConfig';

// Core exports (for advanced customization)
export { CreateUserAction, CreateUserInput, CreateUserOutput } from './core/actions/CreateUserAction';
export { ListUsersAction, ListUsersInput, ListUsersOutput } from './core/actions/ListUsersAction';
export { UserService } from './core/services/UserService';
export { User } from './core/models/User';

// Repository interfaces (for custom implementations)
export { UserRepository, FindAllOptions } from './core/repositories/UserRepository';
```

### 7. Server Setup (Tidy Principle: Configuration-Based)

```typescript
// src/bin/start-server.ts
import express from 'express';
import { AuthExpressPod } from '../pod';
import { AuthPodConfig } from '../pod/config/AuthPodConfig';
import { ErrorMiddleware } from '../common/middleware/ErrorMiddleware';

const config: AuthPodConfig = {
  database: {
    connectionUri: process.env.DB_CONNECTION_URI!,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  features: {
    emailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    passwordReset: process.env.ENABLE_PASSWORD_RESET === 'true',
  },
  emailService: process.env.EMAIL_PROVIDER
    ? {
        provider: process.env.EMAIL_PROVIDER as 'smtp' | 'sendgrid',
        apiKey: process.env.EMAIL_API_KEY,
        fromEmail: process.env.FROM_EMAIL!,
      }
    : undefined,
};

const app = express();
app.use(express.json());

// Setup auth pod
const authPod = new AuthExpressPod(config);
app.use('/api/auth', authPod.getRouter());

// Global error handling
app.use(ErrorMiddleware.handler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Extension Examples

### 1. Custom Route Handler

```typescript
// Custom handler for bulk user creation
const bulkCreateUsersHandler = async (req: express.Request, res: express.Response) => {
  const users = req.body.users;
  const results = [];

  for (const userData of users) {
    try {
      const user = await userService.createUser(userData);
      results.push({ success: true, user });
    } catch (error) {
      results.push({ success: false, error: error.message, userData });
    }
  }

  res.json({ results });
};

const config: AuthPodConfig = {
  // ... other config
  additionalRoutes: [
    {
      method: 'POST',
      path: '/users/bulk',
      handler: bulkCreateUsersHandler,
    },
  ],
};
```

### 2. Override Existing Handler

```typescript
const customCreateUserHandler = async (req: express.Request, res: express.Response) => {
  // Custom logic before user creation
  await validateSpecialRequirements(req.body);

  // Use the original action
  const createUserAction = new CreateUserAction(/* dependencies */);
  const user = await createUserAction.execute(req.body);

  // Custom logic after user creation
  await sendSlackNotification(`New user created: ${user.email}`);

  res.status(201).json(user);
};

const config: AuthPodConfig = {
  // ... other config
  customHandlers: {
    'POST /users': customCreateUserHandler,
  },
};
```

### 3. Pod Extension via Inheritance

```typescript
// Custom pod with additional functionality
export class CustomAuthPod extends AuthExpressPod {
  constructor(config: AuthPodConfig) {
    super(config);
    this.addCustomRoutes();
  }

  private addCustomRoutes(): void {
    this.addRoute('GET', '/admin/stats', this.getAdminStats.bind(this));
    this.addRoute('POST', '/users/invite', this.inviteUser.bind(this));
  }

  private async getAdminStats(req: express.Request, res: express.Response): Promise<void> {
    // Custom admin statistics endpoint
    const stats = await this.userService.getAdminStats();
    res.json(stats);
  }

  private async inviteUser(req: express.Request, res: express.Response): Promise<void> {
    // Custom user invitation logic
    const invitation = await this.userService.createInvitation(req.body);
    res.json(invitation);
  }
}
```

## Testing Strategy

### 1. Unit Tests (Pure Business Logic)

```typescript
// tests/unit/actions/CreateUserAction.test.ts
describe('CreateUserAction', () => {
  let action: CreateUserAction;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockEncryptionService: jest.Mocked<EncryptionService>;

  beforeEach(() => {
    mockUserRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      // ... other methods
    };

    mockEncryptionService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    action = new CreateUserAction(mockUserRepository, mockEncryptionService);
  });

  it('should create user with hashed password', async () => {
    // Given
    const input: CreateUserInput = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'securepassword',
    };

    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockEncryptionService.hash.mockResolvedValue('hashed-password');

    // When
    const result = await action.execute(input);

    // Then
    expect(result.name).toBe(input.name);
    expect(result.email).toBe(input.email);
    expect(mockUserRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: input.name,
        email: input.email,
        passwordHash: 'hashed-password',
      }),
    );
  });
});
```

### 2. Integration Tests (Pod Level)

```typescript
// tests/integration/AuthExpressPod.test.ts
describe('AuthExpressPod', () => {
  let app: express.Application;
  let authPod: AuthExpressPod;

  beforeEach(() => {
    const config: AuthPodConfig = {
      database: { connectionUri: 'mongodb://localhost:27017/test' },
      jwt: { secret: 'test-secret' },
    };

    authPod = new AuthExpressPod(config);
    app = express();
    app.use(express.json());
    app.use('/auth', authPod.getRouter());
  });

  it('should create user via POST /auth/users', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await request(app).post('/auth/users').send(userData).expect(201);

    expect(response.body.name).toBe(userData.name);
    expect(response.body.email).toBe(userData.email);
    expect(response.body.id).toBeDefined();
  });
});
```

## Migration Path

### Step 1: Current State → Phase 1

1. **Move contexts to pods**: `src/contexts/user/` → `src/pod/core/`
2. **Create adapter layer**: Add `src/pod/adapters/express/`
3. **Add configuration**: Create `src/pod/config/AuthPodConfig.ts`
4. **Update entry points**: Modify `src/bin/start-server.ts`

### Step 2: Phase 1 → Multi-Pod

1. **Extract common utilities**: Move `src/common/` to `@your-org/pod-common`
2. **Update imports**: Replace local imports with package imports
3. **Create new pods**: Follow the same structure for new domains

### Step 3: Add Advanced Features

1. **Plugin system**: Implement hook-based extensions
2. **Middleware pipeline**: Add before/after middleware support
3. **Advanced configuration**: Add validation and environment-specific configs

## Success Metrics

A successful implementation should provide:

- **Clear boundaries**: Each pod is self-contained and independently deployable
- **Easy testing**: Core logic is testable without framework dependencies
- **Simple extension**: New functionality can be added without modifying core code
- **Consistent patterns**: Similar problems are solved in similar ways
- **Gradual complexity**: Start simple, add sophistication only when needed

## Conclusion

This reference implementation demonstrates how to apply Tidy Architecture principles in practice. It provides a solid foundation that can evolve from a simple single-pod service to a sophisticated multi-pod platform while maintaining simplicity and clarity at each step.

The key is to start with the simplest solution that works for your current needs, then evolve gradually as those needs change.
