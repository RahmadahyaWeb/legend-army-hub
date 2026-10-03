---
description: Clean up local and remote branches that have been merged to main
---

## Description

Remove stale feature branches after PRs are merged to keep the repository clean

## Steps

1. Fetch latest changes from remote: `git fetch --prune`
2. Switch to main branch: `git checkout main`
3. Pull latest main: `git pull origin main`
4. List all branches merged into main: `git branch --merged main`
5. Identify branches safe to delete (exclude main, develop, staging)
6. Ask user to confirm which branches to delete
7. Delete confirmed local branches: `git branch -d <branch-name>`
8. Delete corresponding remote branches: `git push origin --delete <branch-name>`
9. Run garbage collection: `git gc --prune=now`
10. Show summary of cleaned branches