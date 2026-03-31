# The Tidy Architecture Manifesto

_A pragmatic approach to clean code that prioritizes simplicity, functionality, and gradual evolution over theoretical perfection._

## Philosophy

**Tidy Architecture** is about building software that is clean-ish, simple, and functional. It's the sweet spot between "anything goes" chaos and "CLEAN Architecture" complexity. We believe in:

- **Practical over Perfect**: Solve today's problems well, don't over-engineer for tomorrow's maybes
- **Simple over Complex**: Choose the simplest solution that works, then evolve when needed
- **Functional over Fashionable**: Code should work reliably before it wins architecture awards
- **Gradual over Revolutionary**: Small, incremental improvements beat big rewrites

## Core Principles

### 1. Start Simple, Evolve Gradually

```
❌ Don't: Design for every possible future requirement
✅ Do: Build what you need now, refactor when you actually need more
```

- Begin with straightforward patterns that solve your current problem
- Add complexity only when the pain of not having it becomes real
- Prefer migration strategies over big rewrites
- Keep refactoring options open

### 2. Clear Separation, Minimal Layers

```
❌ Don't: 7 layers of abstraction for a simple CRUD operation
✅ Do: 2-3 clear layers that each have a distinct purpose
```

**Recommended layers:**

- **Core**: Business logic, domain models, pure functions
- **Adapters**: Framework-specific implementations, external integrations
- **Configuration**: Dependency injection, environment setup

### 3. Framework-Agnostic Core, Pragmatic Adapters

```typescript
// Core: Pure business logic
class CreateUserAction {
  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    // Pure business logic here
  }
}

// Adapter: Framework-specific implementation
class ExpressUserController {
  constructor(private createUserAction: CreateUserAction) {}

  async handleRequest(req: Request, res: Response) {
    // Express-specific handling
  }
}
```

### 4. Dependency Injection, But Keep It Simple

```
❌ Don't: Complex DI containers with decorators and magic
✅ Do: Constructor injection with clear, explicit dependencies
```

```typescript
// Good: Clear dependencies, easy to test
class UserService {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
  ) {}
}

// Even better: Let the container/pod manage dependencies
class UserPod {
  private userService: UserService;

  constructor(config: UserPodConfig) {
    this.userService = new UserService(new UserRepository(config.dbConfig), new EmailService(config.emailConfig));
  }
}
```

### 5. Configuration Over Convention (When It Helps)

Make behavior explicit and configurable, but don't go overboard:

```typescript
interface PodConfig {
  // Essential configuration
  database: DatabaseConfig;

  // Optional overrides
  customHandlers?: Record<string, Handler>;
  additionalRoutes?: RouteDefinition[];

  // Feature flags
  enableFeatureX?: boolean;
}
```

### 6. Test-Friendly by Design

```typescript
// Easy to test: pure functions, clear dependencies
const createUser = async (
  input: CreateUserInput,
  userRepository: UserRepository,
  emailService: EmailService,
): Promise<CreateUserOutput> => {
  // Business logic
};

// Easy to mock: interface-based dependencies
interface UserRepository {
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
}
```

## Organizational Patterns

### The Pod Pattern

Organize code into self-contained, domain-focused "pods":

```
auth-pod/
├── core/           # Pure business logic
├── adapters/       # Framework integrations
├── config/         # Configuration interfaces
└── index.ts        # Public API
```

**Benefits:**

- Clear boundaries between domains
- Easy to understand and maintain
- Can be moved between projects
- Supports different deployment strategies

### Repository Strategy: Start Distributed

```
❌ Don't: Start with a monorepo because it "might be easier later"
✅ Do: Start with separate repos, consolidate when you feel the pain
```

**Phase 1: Separate Repos + Shared Package**

```
@your-org/common-utilities
@your-org/auth-pod
@your-org/commerce-pod
@your-org/notifications-pod
```

**Phase 2: Monorepo (when needed)**

```
my-platform/
├── packages/
│   ├── common/
│   ├── auth-pod/
│   └── commerce-pod/
└── package.json
```

## Anti-Patterns to Avoid

### ❌ Architecture Astronauts

- Over-engineering for theoretical future requirements
- Adding layers of abstraction "just in case"
- Implementing patterns because they're popular, not because they solve a problem

### ❌ Premature Optimization

- Complex caching strategies before you have performance problems
- Microservices before you have team scaling issues
- Enterprise patterns for small projects

### ❌ Configuration Hell

- Making everything configurable "for flexibility"
- Complex configuration files with dozens of options
- Magic strings and implicit behavior

### ❌ Abstraction Addiction

- Abstracting everything behind interfaces
- Multiple levels of inheritance
- Generic solutions that solve no specific problem

## Decision Framework

When facing an architectural decision, ask:

1. **Does this solve a real problem I have today?**
2. **Is this the simplest solution that works?**
3. **Can I easily change this later if needed?**
4. **Will this make the code easier to understand and maintain?**
5. **Am I solving a problem or creating one?**

## Gradual Evolution Strategies

### From Messy to Tidy

1. **Extract business logic** from controllers/handlers
2. **Introduce consistent patterns** (same error handling, validation, etc.)
3. **Add configuration interfaces** for external dependencies
4. **Group related functionality** into cohesive modules
5. **Add adapter layers** when you need framework flexibility

### From Tidy to More Sophisticated

1. **Identify pain points** in current architecture
2. **Research solutions** that specifically address those pains
3. **Implement incrementally** with fallback options
4. **Measure the impact** - did it actually help?
5. **Adjust or revert** based on real-world usage

## Success Metrics

A "tidy" codebase should feel:

- **Predictable**: Similar problems are solved in similar ways
- **Readable**: New developers can understand the patterns quickly
- **Maintainable**: Changes are easy to make and test
- **Flexible**: Can adapt to new requirements without major rewrites
- **Boring**: The architecture doesn't get in the way of building features

## Examples in Practice

### Tidy Error Handling

```typescript
// Consistent error types
export class ValidationError extends Error {
  /* ... */
}
export class BusinessLogicError extends Error {
  /* ... */
}

// Consistent error middleware
export class ErrorMiddleware {
  static handle(error: Error, req: Request, res: Response) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    // Handle other error types...
  }
}
```

### Tidy Configuration

```typescript
// Clear, typed configuration
interface AuthPodConfig {
  database: {
    connectionString: string;
    maxConnections?: number;
  };
  jwt: {
    secret: string;
    expiresIn?: string;
  };
  features?: {
    emailVerification?: boolean;
    twoFactor?: boolean;
  };
}

// Configuration validation at startup
const config = validateConfig(process.env);
const authPod = new AuthPod(config);
```

### Tidy Testing

```typescript
// Easy to test: pure functions with clear inputs/outputs
describe('CreateUserAction', () => {
  it('should create user with hashed password', async () => {
    const mockRepository = createMockUserRepository();
    const mockEncryption = createMockEncryptionService();

    const action = new CreateUserAction(mockRepository, mockEncryption);
    const result = await action.execute(validInput);

    expect(result.id).toBeDefined();
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: validInput.email,
        passwordHash: 'hashed-password',
      }),
    );
  });
});
```

## Conclusion

Tidy Architecture is about finding the sweet spot between chaos and over-engineering. It's architecture that:

- **Serves the code**, not the other way around
- **Evolves with your needs**, rather than predicting them
- **Prioritizes developer experience** and maintainability
- **Embraces simplicity** while maintaining flexibility

Remember: The best architecture is the one that doesn't get in your way of building great software.

---

_"Perfect is the enemy of good, but good is the enemy of shipped. Tidy is the friend of both."_
