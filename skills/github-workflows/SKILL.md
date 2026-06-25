---
type: Skill
title: "Github Workflows"
resource: "https://github.com/dirtybits/agent-skills/tree/main/skills/github-workflows"
tags: ["github", "git", "pull-requests", "ci", "workflow"]
timestamp: "2026-06-25T06:43:10Z"
okf_version: "0.1"
name: github-workflows
description: "Use when doing GitHub work end-to-end: auth, repository setup, issue triage, PR implementation, code review, CI monitoring, merge/release, and fallback REST workflows."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [github, git, pull-requests, issues, code-review, ci, auth, repositories]
    related_skills: []
---
# GitHub Workflows

## Overview

This umbrella replaces narrow GitHub skills with one class-level workflow. Load it whenever the task involves GitHub state or Git repository work that will touch GitHub: authentication, cloning/forking, issues, PRs, code review, CI, releases, or API fallbacks.

Prefer the `gh` CLI when authenticated. Fall back to `git` plus GitHub REST/GraphQL with `$GITHUB_TOKEN` when `gh` is missing or lacks a scope.

## When to Use

- Set up or troubleshoot GitHub auth.
- Clone, fork, create, or inspect repositories.
- Create, triage, label, or comment on issues.
- Implement work on a branch and open/update/merge a PR.
- Review a PR or request a pre-commit review before pushing.
- Inspect codebase size/languages before planning repository work.
- Diagnose or monitor GitHub Actions / CI failures.

Do not use for generic local debugging unless GitHub state matters; use `systematic-debugging` or the software-development umbrella for pure local work.

## Operating Pattern

1. **Discover repository context.** Run `git remote -v`, `git status --short --branch`, and derive `OWNER/REPO` from the GitHub remote.
2. **Check auth before side effects.** Prefer `gh auth status`; otherwise locate `$GITHUB_TOKEN` from the environment or `~/.hermes/.env`. Never claim a push/PR/comment happened until the command returns a URL or status.
3. **Search before creating.** Search existing issues and PRs for duplicates before opening new maintainer-visible artifacts.
4. **Make minimal, reviewable changes.** Use a branch, conventional commits, and a clear PR body with summary + tests.
5. **Verify with real outputs.** Run tests locally when possible, inspect CI status/logs, and report exact URLs/IDs.
6. **Escalate permission blockers honestly.** If PAT scopes, fork permissions, or branch protections block the action, leave the branch/patch ready and explain the failed command.

## Labeled Subsections from Former Narrow Skills

### Auth and credentials

- `gh auth status` is the fastest readiness check, but success does not guarantee push/fork/createPullRequest scopes.
- For REST fallback, extract `GITHUB_TOKEN` from the environment, Hermes `.env`, or git credentials only for the current command context; avoid printing secrets.
- If direct push returns 403 or fork creation says `Resource not accessible by personal access token`, diagnose scopes instead of retrying blindly.

### Repository management

- For clone/fork/create/release operations, identify the canonical remote and whether the user has write access before modifying remotes.
- When creating repos, set visibility intentionally and initialize README/license/gitignore only when requested or obviously appropriate.
- For releases, verify tags and generated artifacts locally before calling the GitHub release API.

### Issues

- Search before creating.
- Issue bodies should include observed behavior, expected behavior, reproduction, environment, and evidence.
- Triage actions (labels, assignees, milestones) are side effects; verify the target issue number and repository first.

### Pull requests and CI

- Branch from an up-to-date base, commit focused changes, push, open PR, then monitor checks.
- PR bodies should include Summary and Test Plan. Mention closing issues only when semantically correct.
- Before telling the user to run `gh pr create --body-file /tmp/pr-body.md` or similar, actually write the referenced title/body files to `/tmp` and verify they exist. Prefer `/tmp/pr-title.txt` plus `/tmp/pr-body.md` so the final command can be copy-pasted without missing-file errors.
- If `gh pr create` fails with `GraphQL: Resource not accessible by personal access token (createPullRequest)` or REST PR creation returns `403 Resource not accessible by personal access token`, diagnose token scope/source before retrying. Check whether `GH_TOKEN`, `GITHUB_TOKEN`, `GH_ENTERPRISE_TOKEN`, or `GITHUB_ENTERPRISE_TOKEN` are set; those environment tokens can shadow stored `gh` credentials. Also check `gh auth status -h github.com` and repo permission with `gh repo view OWNER/REPO --json viewerPermission,viewerCanAdminister`.
- For headless `gh` repair, have the user run `unset GH_TOKEN GITHUB_TOKEN GH_ENTERPRISE_TOKEN GITHUB_ENTERPRISE_TOKEN`, then `gh auth refresh -h github.com -s repo` or `gh auth login -h github.com -p ssh -s repo --web --clipboard`; the device-code URL can be opened on their local machine while the Linux session waits. For PAT repair, classic PAT needs `repo`; fine-grained PAT needs repository access plus `Contents: read/write`, `Pull requests: read/write`, and `Metadata: read`.
- If `gh pr create` remains blocked but SSH auth works, push the branch over SSH (`git push -u git@github.com:OWNER/REPO.git BRANCH`) and leave the direct GitHub PR creation URL plus the already-written `/tmp/pr-title.txt` and `/tmp/pr-body.md` as the manual finish path.
- If CI fails, inspect failed logs before patching; do not guess from the check name alone.
- If `gh auth status` shows the right user/permissions but `git push` returns 403, treat it as a git credential-helper/token-path mismatch rather than a repository permission fact. Verify with `gh repo view --json viewerPermission`, then either run `gh auth setup-git`, push over SSH if configured, or use a temporary `GIT_ASKPASS`/extraheader flow that sources `gh auth token`; never print the token, and still report the exact push blocker if it remains.

### Code review

- Review diffs, not vibes: `gh pr diff`, changed files, test impact, security implications, and backwards compatibility.
- Inline comments should be precise, actionable, and tied to a file/line when possible.
- Pre-commit reviews should run local quality gates and fix obvious issues before involving maintainers.

### Ordering multiple open PRs

When asked to determine a merge order for a repo's open PRs, ground the answer in both GitHub state and local mergeability rather than only titles:

1. List open PRs with `gh pr list --json number,title,headRefName,baseRefName,isDraft,mergeStateStatus,statusCheckRollup,body,url` and note draft/WIP language, failing/pending checks, and whether checks are stale or current.
2. Fetch PR heads locally, e.g. `git fetch origin main '+refs/pull/*/head:refs/remotes/pr/*' --prune`, then compare each PR to `origin/main` with `git merge-base --is-ancestor origin/main refs/remotes/pr/NUMBER` and `git diff --name-only origin/main...refs/remotes/pr/NUMBER`.
3. Use a temporary worktree from `origin/main` to test mergeability without touching the user's checkout: `git worktree add <tmp> origin/main`; for each candidate run `git merge --no-commit --no-ff refs/remotes/pr/NUMBER`, record conflicts with `git diff --name-only --diff-filter=U`, then abort/reset and remove the worktree.
4. If the ordering depends on stacked docs or shared files, test likely sequences in the temp worktree. Report which sequence creates conflicts and which files need rebasing.
5. Prioritize merge order by: unblockers/safety/protocol correctness first, small correctness fixes before large feature surfaces, observability after correctness, and explicitly WIP/product-decision PRs last/hold even if they are technically mergeable.
6. Final output should separate "merge now", "rebase/fix then merge", "feature after hardening", and "hold" when applicable, with exact PR numbers, URLs, check/merge status, and conflict file paths. Do not merge unless the user explicitly asked for merging.

### Codebase inspection

- Use language/LOC summaries (for example `pygount`) to size the repo and find dominant stacks before planning broad changes.
- Treat generated/vendor directories as noise unless the task specifically targets them.

## Preserved Detail

Former standalone skill packages are preserved under `references/absorbed-packages/<skill-name>/` with their original relative layout. When following one of those recipes, treat that directory as the old skill root so its `references/`, `templates/`, and `scripts/` paths still resolve.

## Verification Checklist

- [ ] Repository and `OWNER/REPO` confirmed.
- [ ] Auth method confirmed without exposing secrets.
- [ ] Existing issues/PRs searched before creating new ones.
- [ ] Local changes are on a branch with a clean, focused diff.
- [ ] Tests or CI status checked with real command output.
- [ ] Final response includes exact URLs, issue/PR numbers, or the blocker command/error.
