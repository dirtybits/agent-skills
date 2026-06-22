---
type: Skill
name: skills-organization
title: "Skills Organization"
description: Organize and synchronize local agent skill directories across Codex, Claude, Cursor, Hermes, OpenClaw, and other agent tools. Use when the user asks to audit, mirror, link, migrate, or reconcile skill folders such as ~/.agents/skills, ~/.codex/skills, ~/.claude/skills, ~/.cursor/skills, ~/.hermes/skills, ~/.openclaw/skills, or tool-specific skill directories.
resource: "https://github.com/dirtybits/agent-skills/tree/main/skills/skills-organization"
tags: ["skills", "organization", "workflow"]
timestamp: "2026-06-22T19:13:38Z"
okf_version: "0.1"
license: "all-rights-reserved"
---
# Skills Organization

Use this skill when keeping local agent skill folders aligned across tools. Treat it as a power-user local workflow: audit first, explain the isolation tradeoffs, then make writes only after the user approves the exact paths.

## Core Stance

- Treat `~/.agents/skills` as the canonical source of truth for personal/shared skills.
- Mirror an agent tool's normal `skills` path to the canonical root with a directory symlink only when the user intentionally wants shared cross-agent skills.
- Prefer a hub-and-spoke layout over cross-linking every directory to every other directory.
- Do not blindly import product-managed, vendor-managed, plugin-cache, backup, or bundled skill directories.
- Shared storage does not guarantee shared compatibility. Codex, Claude, Cursor, Hermes, OpenClaw, and other tools may expect different skill schemas, frontmatter, file layouts, or install metadata.
- Preserve anything you replace. Move real directories to timestamped backups before creating symlinks.

## Hermes Profile Warning

Hermes can use both the active-profile skills path and named profile skill directories:

- Active profile: `~/.hermes/skills`
- Named profiles: `~/.hermes/profiles/<profile>/skills`

Only link `~/.hermes/skills` if the user explicitly wants the active Hermes profile to share the common skill set. Do not symlink `~/.hermes/profiles/*/skills` automatically. Profile directories can represent intentionally isolated contexts, and flattening them into `~/.agents/skills` can make skills from one context bleed into another.

If the user wants Hermes integration but not shared storage, prefer normal Hermes skill install or management commands and leave profile-specific directories alone.

## Why Not Cross-Link Everything?

If `~/.codex/skills`, `~/.claude/skills`, and `~/.cursor/skills` are symlinks to `~/.agents/skills`, then adding a skill through any of those paths already lands in the shared directory. A mesh of symlinks between tool directories is harder to reason about, easier to loop, and offers no practical benefit over one canonical target.

Use this model instead:

```text
~/.agents/skills
  ^-- ~/.codex/skills
  ^-- ~/.claude/skills
  ^-- ~/.cursor/skills
  ^-- ~/.hermes/skills
  ^-- ~/.openclaw/skills
  ^-- any other personal agent skills path
```

## Audit Workflow

This phase is inventory only. Do not write, move, copy, or link anything yet.

1. Inventory the expected paths:

```bash
for d in "$HOME/.agents/skills" "$HOME/.codex/skills" "$HOME/.claude/skills" "$HOME/.cursor/skills" "$HOME/.hermes/skills" "$HOME/.openclaw/skills"; do
  ls -ld "$d" 2>/dev/null || true
  readlink "$d" 2>/dev/null || true
done
```

2. Confirm the canonical root exists and contains the expected personal skills:

```bash
find "$HOME/.agents/skills" -maxdepth 2 -name SKILL.md -print | sort
```

3. Check for non-canonical directories that might contain personal skills:

```bash
for root in "$HOME/.codex" "$HOME/.claude" "$HOME/.cursor" "$HOME/.hermes" "$HOME/.openclaw"; do
  [ -d "$root" ] && find "$root" -maxdepth 2 -type d -name skills -print
done
```

4. Check for Hermes profile-specific skill folders without modifying them:

```bash
find "$HOME/.hermes/profiles" -maxdepth 3 -type d -name skills -print 2>/dev/null || true
```

5. Check for obvious symlink loop hazards before proposing links:

```bash
canonical="$(cd "$HOME/.agents/skills" 2>/dev/null && pwd -P)" || canonical=""
for d in "$HOME/.codex/skills" "$HOME/.claude/skills" "$HOME/.cursor/skills" "$HOME/.hermes/skills" "$HOME/.openclaw/skills"; do
  consumer_parent="$(cd "$(dirname "$d")" 2>/dev/null && pwd -P)" || consumer_parent=""
  printf '%s\n  canonical=%s\n  consumer_parent=%s\n' "$d" "$canonical" "$consumer_parent"
done
```

Do not link a consumer path if the canonical root is inside that consumer path, if the consumer path is inside the canonical root, or if either path resolves through the other.

6. Classify each path:

- Symlink to `~/.agents/skills`: already aligned.
- Missing path: create a symlink if the tool expects that path.
- Real directory with personal skills: reconcile into `~/.agents/skills`, back up the directory, then replace it with a symlink.
- Symlink elsewhere: inspect before changing.
- Vendor/product/cache directory: leave alone unless the user explicitly asks to import from it.

7. Present the intended write plan and ask the user to approve it before continuing.

## Reconcile Workflow

When a consumer path is a real directory instead of a symlink:

1. List its skills with `find <path> -maxdepth 2 -name SKILL.md -print`.
2. For each skill folder, compare against `~/.agents/skills/<skill-name>`.
3. If the skill is missing from the canonical root, preview the copy first, preserving file metadata.
4. If the skill exists in both places, run `diff -ru` and show conflicts to the user. Do not choose silently.
5. Move the original directory to `skills.pre-mirror-backup-YYYYMMDD-HHMMSS`.
6. Create the symlink to `~/.agents/skills`.

Dry-run examples:

```bash
rsync -a --dry-run "$HOME/.openclaw/skills/example-skill/" "$HOME/.agents/skills/example-skill/"
diff -ru "$HOME/.openclaw/skills/example-skill" "$HOME/.agents/skills/example-skill"
```

Write-phase example after user approval, for a target confirmed to be missing:

```bash
set -e
source_skill="$HOME/.openclaw/skills/example-skill"
target_skill="$HOME/.agents/skills/example-skill"
test ! -e "$target_skill" || {
  printf 'Target exists; stop and run diff -ru before writing: %s\n' "$target_skill" >&2
  exit 1
}
cp -a "$source_skill" "$target_skill"
backup="$HOME/.openclaw/skills.pre-mirror-backup-$(date +%Y%m%d-%H%M%S)"
mv "$HOME/.openclaw/skills" "$backup"
ln -s "$HOME/.agents/skills" "$HOME/.openclaw/skills"
```

Only run write commands after confirming the source, target, and backup paths are correct.

## Collision Policy

- The canonical root wins by default, but never overwrite a conflicting skill without user approval.
- Identical duplicates can be treated as already reconciled.
- If two folders share a name but have different content, preserve both by copying the non-canonical copy to a temporary comparison or backup location and ask the user which version should become canonical.
- Do not delete backups as part of the sync task unless explicitly requested.

## Verification

After making changes:

```bash
readlink "$HOME/.codex/skills" "$HOME/.claude/skills" "$HOME/.cursor/skills" "$HOME/.hermes/skills" "$HOME/.openclaw/skills" 2>/dev/null || true
find "$HOME/.agents/skills" -maxdepth 2 -name SKILL.md -print | sort
```

The expected result is that every personal agent `skills` path resolves to `~/.agents/skills`, and the canonical root contains the skills the user expects.

For a stronger check, create a temporary test folder only if the user agrees, then verify it appears through every symlinked path and remove the temporary folder afterward.

## Safety Rules

- Do not use `rm -rf` for reconciliation. Move to backups instead.
- Do not merge `skills.pre-mirror-backup-*` folders back into source automatically.
- Do not sync plugin caches, bundled runtime skills, marketplace/vendor checkouts, or Cursor's `skills-cursor` directory unless the user specifically asks.
- Do not symlink Hermes named profile skill directories automatically.
- Prefer each tool's native install or management flow when the user wants tool-specific skills instead of shared cross-agent skills.
- Keep commands readable and inspectable; this task is about preserving local workflow state, not being clever.

## Example Observed State

The following is an example from one machine on 2026-06-11, not a source of truth. Verify the current machine before acting and do not over-weight stale observations.

- `~/.codex/skills -> ~/.agents/skills`
- `~/.claude/skills -> ~/.agents/skills`
- `~/.cursor/skills -> ~/.agents/skills`
- `~/.hermes/skills` was not present on that machine; if Hermes is installed, audit it before linking it to `~/.agents/skills`.
- `~/.openclaw/skills` was present as a real directory on that machine; audit and reconcile it before replacing it with a symlink.
- `~/.cursor/skills-cursor` is a separate Cursor-managed skill directory; do not merge it automatically.
- `~/.codex/vendor_imports/skills` is a vendor import checkout; do not merge it automatically.
- `~/.agent/skills` was not present on that machine; if it exists elsewhere, audit it before using it.
