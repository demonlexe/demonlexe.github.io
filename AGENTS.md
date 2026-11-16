# Agent Guidelines

## Git Worktrees

Place all git worktrees inside `.worktrees/<name>` at the repository root (git-ignored via `.gitignore`):

```bash
git worktree add .worktrees/<name> -b <branch-name>
```

Install dependencies inside a new worktree (`npm ci`) before running builds, lint, or tests.

## npm Registry

Use only the public npm registry. Never add Atlassian-specific packages (`@atlassian/*`, `@atlaskit/*`) or `packages.atlassian.com` URLs, because they can't be resolved outside Atlassian's network.

- Keep every `resolved` URL in `package-lock.json` under `https://registry.npmjs.org/`; if an install rewrites them to `packages.atlassian.com`, rewrite them back before committing.
- `.npmrc` pins `registry=https://registry.npmjs.org/`.
- `build/publicRegistry.test.ts` enforces this.
