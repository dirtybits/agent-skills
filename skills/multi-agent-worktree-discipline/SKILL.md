---
type: Skill
name: multi-agent-worktree-discipline
title: "Multi-Agent Worktree Discipline"
description: Operate safely in repositories where multiple coding agents (Claude, Codex, Cursor, humans) work in parallel git worktrees. Covers session bootstrap in a fresh worktree, toolchain/version pinning, lockfile-safe dependency installs, branch topology and reconciliation, recovering "lost" work without redoing it, commit signing in headless shells, and account-identity checks before pushing or opening PRs. Use at the start of any session in a worktree, whenever work seems missing, before switching branches, and before any commit/push/PR.
resource: "https://github.com/dirtybits/agent-skills/tree/main/skills/multi-agent-worktree-discipline"
tags: ["git", "worktrees", "multi-agent", "workflow", "session-bootstrap"]
timestamp: "2026-07-06T20:00:00Z"
okf_version: "0.1"
license: MIT
---

# Multi-Agent Worktree Discipline

## Why this skill exists

When several agents share one repository through git worktrees, the expensive failures are not merge conflicts — they are silent ones: an agent redoes work that exists uncommitted in another worktree, a lockfile reinstall wipes an uncommitted dependency, a branch switch strands edits, a resumed session pushes with the wrong GitHub account, or a "fixed" build was actually run against the wrong Node version. Each of these costs an hour or more and looks like a mystery until you know the pattern. This skill is the checklist and the recovery protocols.

## 1. Session bootstrap (run before doing anything else)

1. **Identify where you are.** Run `git worktree list` and `git rev-parse --show-toplevel`. Confirm which worktree you are in and which branch it has checked out. Never infer location from the path string — on case-insensitive filesystems (macOS default) `~/repos/x` and `~/Repos/x` are the same directory, and per-agent worktrees often live under hidden dirs (`.codex/`, `.cursor/`, `.claude/worktrees/`, `~/.agents/worktrees/`).
2. **Pin the toolchain per command, not per session.** Agent shells frequently resolve a different runtime than the repo expects (`.nvmrc`, `rust-toolchain`, etc.) because the sandbox PATH is built before version managers run. If the repo pins a version, export the pinned toolchain's bin dir onto PATH **inside every shell invocation** (shell state may not persist between calls). Symptom of getting this wrong: test runners dying with module-format errors (`ERR_REQUIRE_ESM`), not a clear version message.
3. **Install dependencies from the lockfile.** Fresh worktrees lack gitignored artifacts: `node_modules`, `.env.local`, build caches. If the repo has a worktree-setup script, run it. Otherwise install with the lockfile-respecting command (`npm ci`, `pnpm install --frozen-lockfile`) — plain `npm install` can rebuild optional native bindings incorrectly and mutate the lockfile.
4. **Beware symlinked/shared node_modules.** Some worktrees symlink `node_modules` to the primary checkout to save disk. That means: (a) installing in one place affects all of them, and (b) a build failure like `Cannot find module 'x'` usually means broken worktree resolution or a stale build cache (`.next`, `dist`) — fix the link and clear the cache; do **not** add duplicate dependencies or edit app code to route around it.
5. **Verify your push identity.** Run `gh auth status` (and `git config user.email`). Session resume and multi-account setups can silently switch the active account to one that cannot create PRs (e.g. an enterprise-managed account). Switch back explicitly (`gh auth switch --user <name>`) before any push or PR.

## 2. Branch topology: shared feature branch + per-agent scratch

- Treat **one shared feature branch** (`feat/<topic>`) as the integration point for a piece of work, and per-agent branches (`claude/…`, `codex/…`, `cursor/…`) as **scratch** that rebases or resets onto it.
- A branch can be checked out in **only one worktree at a time**. If checkout fails with "already checked out", find the other worktree with `git worktree list` instead of force-detaching.
- One reviewable unit (phase/feature) = one PR off current `main`. Do not accumulate multiple phases on one branch.

## 3. The "lost work" protocol (run BEFORE redoing anything)

Work that seems missing is almost never lost — it is on a branch or in a worktree you are not looking at. Redoing it creates divergent duplicate commits that must then be reconciled by hand.

1. `git log --all --oneline --graph | head -50` — look for the commits you expected.
2. `git branch -a --contains <sha>` — find which branch actually holds a commit.
3. Check other worktrees: uncommitted changes in worktree A are invisible from worktree B's branch. That is not loss.
4. Check for auto-commit tooling (e.g. `gcai` or IDE auto-commits) that may have captured the work on a different branch.
5. Only after all four come up empty, treat the work as lost.

## 4. Branch-switch and commit hygiene

- **Switching a worktree's branch reverts tracked-file edits** to the target branch and strands your work on the old branch. Untracked files survive the switch but belong to no branch until added. Rule: commit early, even WIP, before any branch operation.
- **Commit dependency changes immediately and atomically** (`package.json` + the root lockfile in the same commit). Repos with session-start `npm ci` hooks will silently wipe an uncommitted `npm install` on the next session — the classic symptom is a dependency that "keeps disappearing".
- Keep per-repo git author identity correct even when global config differs (work vs personal): set `git config user.name/user.email` locally in the repo when needed.

## 5. Signed commits in headless shells

If the repo expects signed commits (1Password/SSH/GPG signing):

1. Attempt the normal signed commit first — signing often works headlessly when the agent socket is available.
2. If signing fails, **do not fall back to unsigned silently.** Report the exact error to the human and hand them the recovery command: `git commit --amend -S --no-edit`, then `git push --force-with-lease` if already pushed.
3. Verify after committing: `git log -1 --show-signature`.

## 6. Failure-mode quick reference

| Symptom | Likely cause | First move |
| --- | --- | --- |
| Test runner dies with `ERR_REQUIRE_ESM` / weird module errors | Wrong runtime version ahead of the version manager | Export pinned toolchain PATH in the same command |
| `Cannot find module 'x'` in a worktree that "should" work | Broken node_modules link or stale build cache | Re-link/reinstall from lockfile; clear `.next`/`dist` |
| Work from a previous session "gone" | It's on another branch/worktree, uncommitted, or auto-committed | §3 protocol before redoing anything |
| A dependency you added keeps vanishing | Session-start lockfile reinstall wiping uncommitted install | Commit `package.json` + lockfile together |
| `gh pr create` fails with permissions/SSO error | Active gh account flipped to a managed account | `gh auth status`; switch account |
| "Branch already checked out" | Another worktree holds it | `git worktree list`; work there or use a new branch |
| Port-in-use from a test validator/dev server | Stale process — or a sandbox false positive | `lsof -nP -i :<port>` first; only kill what you can see |

## 7. Done-when for this skill

A session followed this skill when: the worktree/branch was identified before edits; installs used the lockfile; no duplicate commits were created for "lost" work; dependency changes are committed with the lockfile; the commit is signed (or the failure reported verbatim with the amend command); and the push/PR went out under the intended account.
