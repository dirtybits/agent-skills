---
type: Reference
title: "Github Workflows Pr Auth Fork Permissions"
description: "Reference material for the Github Workflows skill."
resource: "https://github.com/dirtybits/agent-skills/blob/main/skills/github-workflows/references/absorbed-packages/github-pr-workflow/references/pr-auth-fork-permissions.md"
tags: ["github", "git", "pull-requests", "ci", "workflow", "reference"]
timestamp: "2026-06-25T06:43:10Z"
okf_version: "0.1"
---
# PR auth and fork permission troubleshooting

Use this when a local branch and commit are ready but pushing or opening the PR fails.

## Symptoms

- `remote: Permission to OWNER/REPO.git denied to USER.`
- `fatal: unable to access 'https://github.com/OWNER/REPO.git/': The requested URL returned error: 403`
- `failed to fork: HTTP 403: Resource not accessible by personal access token`
- `pull request create failed: GraphQL: Resource not accessible by personal access token (createPullRequest)`

## Durable workflow

1. Do not report that the PR is open until GitHub returns a PR URL.
2. Check the active GitHub account:
   ```bash
   gh auth status
   gh auth status --json hosts --jq '.hosts.github.com.scopes // []'
   ```
3. If direct push to `origin` is denied, try the fork flow:
   ```bash
   gh repo fork OWNER/REPO --clone=false
   git remote add USER git@github.com:USER/REPO.git
   git push -u USER BRANCH
   gh pr create --repo OWNER/REPO --base main --head USER:BRANCH --title "..." --body "..."
   ```
4. If fork or PR creation fails with `Resource not accessible by personal access token`, the token lacks required scopes or the credential type cannot perform that action. Ask the user to refresh GitHub auth from an external shell:
   ```bash
   gh auth refresh -h github.com -s repo -s public_repo
   ```
   In non-interactive/gateway sessions this may print a device code and block, so the user must complete it outside the agent run.
5. If auth cannot be fixed immediately, leave the branch and commit ready locally, optionally create a patch with:
   ```bash
   git format-patch -1 HEAD --stdout > /tmp/<short-description>.patch
   ```
   Report the local branch, commit, test results, and exact auth blocker.
