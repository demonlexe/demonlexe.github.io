# Agent Guidelines

## Git Worktrees

Place all git worktrees inside `.worktrees/<name>` at the repository root (git-ignored via `.gitignore`):

```bash
git worktree add .worktrees/<name> -b <branch-name>
```

Install dependencies inside a new worktree (`npm ci`) before running builds, lint, or tests.
