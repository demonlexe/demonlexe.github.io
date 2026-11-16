# Agent Guidelines

## Git Worktrees

Place all git worktrees inside `.worktrees/<name>` at the repository root (git-ignored via `.gitignore`):

```bash
git worktree add .worktrees/<name> -b <branch-name>
```

Install dependencies inside a new worktree (`npm ci`) before running builds, lint, or tests.

## UI Change Screenshots

For any change that affects the app's UI (components, styles, layout, copy, assets), attach **before and after** screenshots to the pull request.

1. Capture the **before** state from `main` (or the base branch) before making changes: run `npm run dev` and screenshot each affected view.
2. Capture the **after** state from your branch, using the same pages, viewport size, and interaction state.
3. Include both desktop and mobile widths when the change is responsive or touches layout.
4. Put them side by side in the PR description under a `## Screenshots` heading, using a Before/After table:

   ```markdown
   | Before | After |
   | ------ | ----- |
   | ![before](<url>) | ![after](<url>) |
   ```

5. If you cannot upload images to the PR directly, commit them to the PR branch under `.pr-screenshots/<branch-name>/` and link them with raw GitHub URLs pinned to the commit SHA, so the links keep working after the files are removed. Delete them in a follow-up commit before merging.

If a change has no visible effect (refactors, tests, docs, config), say so in the PR description instead of attaching screenshots.
