---
description: 'Execute a single Ralph loop iteration - complete one work unit from tasks.md with proper commits and progress tracking'
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Scope Constraint

**CRITICAL**: Complete AT MOST ONE user story in this iteration.

- If you cannot complete an entire user story, complete as many tasks as you can
- Partial progress is fine -- uncompleted tasks will be handled in subsequent iterations
- DO NOT start a second user story even if you have time remaining
- This prevents context rot and keeps changes reviewable

## Outline

1. **Setup**: Run the prerequisite check script from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax appropriate to your shell.

   ```bash
   .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
   ```

   ```powershell
   .specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks
   ```

2. **Read context first**:
   - Read `FEATURE_DIR/progress.md` if it exists -- check the `## Codebase Patterns` section for discovered conventions
   - Read `FEATURE_DIR/tasks.md` -- understand task structure and identify next incomplete user story
   - Read `FEATURE_DIR/plan.md` for tech stack, architecture, and file structure
   - **IF EXISTS**: Read `FEATURE_DIR/data-model.md` for entities and relationships
   - **IF EXISTS**: Read `FEATURE_DIR/contracts/` for API specifications
   - **IF EXISTS**: Read `FEATURE_DIR/research.md` for technical decisions and constraints

3. **Identify scope**:
   - Find the FIRST user story section with incomplete tasks (`- [ ]`)
   - Work ONLY on tasks within that single user story
   - Example: If "US-001: Initialize Ralph Command" has incomplete tasks, work only on US-001

4. **Implement tasks**:
   - Complete tasks in dependency order (non-[P] before parallel [P] where noted)
   - Follow TDD when appropriate: write tests first, then implementation
   - Run quality checks after each task (typecheck, lint, test as appropriate)
   - Mark each completed task by changing `[ ]` to `[x]` in tasks.md

5. **Commit on user story completion (implementation commit)**:
   - When ALL tasks in the current user story are complete (`[x]`), create the **implementation commit** first.
   - Stage changed files **except** `FEATURE_DIR/progress.md` (e.g. `git add -A` then `git reset HEAD -- FEATURE_DIR/progress.md`, or add paths explicitly). That keeps the progress report able to point at a **stable** hash for this commit.
   - Commit:

     ```sh
       git commit \
          -m "<emoji> (<scope>): <description lowercase>" \
          -m "<optional body with concise details when relevant>"
     ```

   - Follow the repository commit convention in `.vscode/settings.json`
   - Use a gitmoji message in the format `<emoji> (<scope>): <description lowercase>`
   - Choose the emoji that matches the change type and use a narrow scope based on the package or area changed
   - For non-trivial changes, add a body after a blank line summarizing the key changes, rationale, and important validation; omit the body for trivial changes
   - Keep the body concise and factual, preferably 2-5 short lines or bullets
   - Example: `git commit -m "🦺 (validation): add zod schemas and validation package" -m "- add task, user, and tag schemas\n- expose zod error helpers\n- run pnpm lint and pnpm test"`
   - Do not use Conventional Commit prefixes like `feat(...)` or capitalize the description
   - If only partial progress, NO commit -- let the next iteration continue

6. **Update progress log (follow-up commit)**:
   - Run `git rev-parse HEAD` and use the **full** hash as the **Commit** value in the new iteration block **only if** step 5 created a commit (otherwise use `No commit - partial progress`).
   - Create or append to `FEATURE_DIR/progress.md`
   - Add any discovered patterns to `## Codebase Patterns` section at TOP of file
   - Use the Progress Report Format below
   - Commit **only** `FEATURE_DIR/progress.md` in a **new** commit (e.g. `📝 (specs): update ralph progress for iteration N`).
   - **Do not** use `git commit --amend` to attach `progress.md` to the implementation commit or to “fix” the recorded **Commit** hash. Amending **rewrites** the implementation commit’s hash, which invalidates the hash you wrote in `progress.md` and causes a **hash-mismatch loop**. A separate progress commit is always correct.

## Progress Report Format

APPEND to FEATURE_DIR/progress.md:

```markdown
---
## Iteration [N] - [Current Date/Time]
**User Story**: [US-XXX title or "Partial progress on US-XXX"]
**Tasks Completed**: 
- [x] Task ID: description
- [x] Task ID: description
**Tasks Remaining in Story**: [count] or "None - story complete"
**Commit**: [commit hash if story completed, or "No commit - partial progress"]
**Files Changed**: 
- path/to/file.ext
**Learnings**:
- [patterns discovered, gotchas, useful context for future iterations]
---
```

## Stop Conditions

**If ALL tasks in tasks.md are complete** (`[x]`), output exactly:

```text
<promise>COMPLETE</promise>
```

This signals the ralph loop orchestrator to terminate successfully.

**If tasks remain**, end your response normally. The next iteration will continue.

## Quality Gates

- ALL changes must pass quality checks before marking tasks complete
- DO NOT commit broken code
- Follow existing code patterns (check Codebase Patterns in progress file)
- Reference plan.md for architecture decisions
- Run tests if they exist before committing

## Code Style

Follow the patterns established in the codebase:

- Check existing files for naming conventions
- Match indentation and formatting styles
- Use the same import/module patterns
- Follow any linting rules configured in the project

## Error Handling

| Condition             | Expected Behavior                                                              |
| --------------------- | ------------------------------------------------------------------------------ |
| User story unclear    | Ask for clarification in progress entry, mark tasks as blocked                 |
| Tests fail            | Report failure, do not mark task complete, no commit                           |
| Cannot complete story | Report partial progress, commit only if all completed tasks form coherent unit |
| All tasks done        | Commit final story, output `<promise>COMPLETE</promise>`                       |
| Dependencies missing  | Note in progress file, skip to next available task                             |
