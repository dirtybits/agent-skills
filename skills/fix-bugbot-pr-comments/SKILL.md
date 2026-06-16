---
name: fix-bugbot-pr-comments
description: Fetch, triage, and fix unresolved Cursor Bugbot or automated PR review comments. Use when the user asks to fix Bugbot findings, babysit a PR, resolve automated review comments, or make a pull request merge-ready.
---

# Fix Bugbot PR Comments

Use this workflow to make a PR merge-ready after Cursor Bugbot or other automated review comments appear.

## Core Rules

- Use `gh` for all GitHub operations.
- Fetch unresolved review threads first; filter out resolved threads before reading comment bodies.
- Read only each comment body plus the minimum path, line, and URL needed to act.
- Fix only clear, correct, in-scope feedback.
- Keep changes minimal and scoped to the PR.
- Do not modify CI workflows or config just to make checks pass.
- Do not include unrelated files or generated artifacts in commits.
- If a branch requires signed commits and this environment cannot produce a verified signature, stop and report the exact blocker instead of force-pushing or bypassing rules.

## Resolve PR Context

Start from the current branch:

```bash
git status --short --branch
gh pr view --json number,url,title,headRefName,baseRefName,mergeStateStatus,reviewDecision,isDraft
gh pr checks --json name,bucket,state,workflow,link
```

If there are local changes, determine whether they are yours and relevant before touching them.

## Fetch Unresolved Comments

Use GraphQL so resolved threads are filtered before reading bodies:

```bash
OWNER_REPO="$(gh repo view --json owner,name -q '.owner.login + "/" + .name')"
OWNER="${OWNER_REPO%/*}"
REPO="${OWNER_REPO#*/}"
PR="$(gh pr view --json number -q .number)"

gh api graphql \
  -f owner="$OWNER" \
  -f repo="$REPO" \
  -F number="$PR" \
  -f query='query($owner:String!, $repo:String!, $number:Int!) {
    repository(owner:$owner, name:$repo) {
      pullRequest(number:$number) {
        reviewThreads(first:100) {
          nodes {
            isResolved
            isOutdated
            path
            line
            comments(first:10) {
              nodes {
                author { login }
                body
                url
              }
            }
          }
        }
        reviews(first:50) {
          nodes {
            author { login }
            state
            body
            url
          }
        }
      }
    }
  }' \
  --jq '.data.repository.pullRequest as $pr |
    {
      unresolvedThreads: [
        $pr.reviewThreads.nodes[]
        | select(.isResolved == false)
        | {path,line,isOutdated,comments:[.comments.nodes[] | {author:.author.login, body, url}]}
      ],
      reviews: [$pr.reviews.nodes[] | {author:.author.login, state, body, url}]
    }'
```

Classify each unresolved thread:

- **Fix now:** Clear, correct, in-scope bug or missing test.
- **Needs human:** Product decision, ambiguous requested behavior, or tradeoff.
- **Won't fix:** Incorrect, stale, or out of PR scope. Reply with a short rationale if appropriate.

## Fix Loop

For each clear in-scope issue:

1. Read the referenced file and the smallest surrounding context needed.
2. Make the smallest safe fix.
3. Add or update focused tests when behavior changes.
4. Run scoped tests first.
5. Run broader checks only when scoped checks pass or when the change touches shared behavior.
6. Re-check generated files and unrelated artifacts before staging.

Common generated-file guard:

```bash
git status --short
```

If a build rewrites a tracked binary or generated artifact unrelated to the fix, restore it before committing.

## CI Loop

Use PR checks as the source of truth:

```bash
gh pr checks --json name,bucket,state,workflow,link
```

If checks are pending:

```bash
gh pr checks --watch --fail-fast
```

If checks fail:

1. Inspect the failing check link or GitHub Actions failed logs.
2. Extract the first actionable error.
3. Fix only failures caused by this PR.
4. If the failure is unrelated and likely already fixed upstream, fetch and merge latest `origin/main`.
5. If fixing would require changing CI itself, stop and report.

## Commit And Push

Before committing:

```bash
git status --short --branch
git diff --check
git diff --cached --stat
```

Stage only files changed for the Bugbot fixes. Use a concise message:

```bash
git commit -m "fix(scope): concise summary"
git push
```

After pushing, re-run:

```bash
gh pr checks --json name,bucket,state,workflow,link
```

Then fetch unresolved threads again. Continue until CI is green and all actionable comments are resolved or clearly reported.

## Final Report

Keep the report short:

- Issues fixed.
- Tests/checks run.
- Current CI status.
- Remaining blockers, if any, with URLs.
