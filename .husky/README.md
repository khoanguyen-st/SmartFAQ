# Husky Git Hooks

This directory contains Git hooks managed by Husky to enforce code quality.

## Pre-commit Hook

Runs `lint-staged` to automatically:

- Fix ESLint errors in TypeScript/JavaScript files
- Format code with Prettier
- Fix Ruff lint errors in Python files
- Format Python code with Black

Only staged files are checked and fixed.

## Commit Message Hook

Enforces conventional commit message format:

```
type(scope): message
```

### Valid Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes
- `revert`: Revert previous commit

### Examples:

```bash
git commit -m "feat(api): add user authentication endpoint"
git commit -m "fix(web-admin): resolve pagination bug"
git commit -m "docs: update README with setup instructions"
git commit -m "style(web-student): fix indentation"
```

## Bypassing Hooks

If you need to bypass hooks (not recommended):

```bash
git commit --no-verify -m "your message"
```
