# Shared Agent Skills on One Machine

This guide makes the skills in this repository available to Codex, Claude, and Cursor from one maintained checkout. It is written for a new machine: audit first, then make only the links you have reviewed.

## Model

Use a hub-and-spoke layout:

```text
<checkout>/skills/<skill-name>/
        ^
        | per-skill symlink
~/.agents/skills/<skill-name>
        ^
        | directory symlinks
~/.codex/skills   ~/.claude/skills   ~/.cursor/skills
```

`~/.agents/skills` is the shared runtime hub. This repository is the Git-managed source for the skills it contains. Do **not** link `~/.agents/skills` directly to this checkout: skills are nested under `skills/`, while agents expect individual skill directories directly below the runtime hub.

Keeping the checkout current with `git pull --ff-only` updates every already-linked repository skill for all three agents. When the repository adds a new skill, create one additional per-skill link after auditing it.

## Before making changes

1. Clone this repository in a permanent local location, outside a cloud-synced folder if the skills may contain private operational guidance.
2. Run the repository checks:

   ```bash
   cd /path/to/agent-skills
   npm run validate
   ```

3. Inventory the existing agent folders. This is read-only:

   ```bash
   for d in "$HOME/.agents/skills" "$HOME/.codex/skills" "$HOME/.claude/skills" "$HOME/.cursor/skills"; do
     printf '%s\n' "$d"
     ls -ld "$d" 2>/dev/null || true
     readlink "$d" 2>/dev/null || true
   done
   ```

4. Inspect existing runtime skills before choosing a source of truth:

   ```bash
   find "$HOME/.agents/skills" -maxdepth 2 -name SKILL.md -print 2>/dev/null | sort
   ```

If an agent folder is a real directory, it may contain skills that should be preserved. If it is a symlink to somewhere other than `~/.agents/skills`, inspect that target before changing it.

## Set up the shared runtime hub

Only run these commands after the audit confirms that replacing the three consumer paths is intended. Any real directory is moved to a timestamped backup; nothing is deleted.

```bash
set -euo pipefail

hub="$HOME/.agents/skills"
mkdir -p "$hub"

for consumer in "$HOME/.codex/skills" "$HOME/.claude/skills" "$HOME/.cursor/skills"; do
  if [ -L "$consumer" ]; then
    test "$(readlink "$consumer")" = "$hub" || {
      printf 'Existing symlink needs review: %s -> %s\n' "$consumer" "$(readlink "$consumer")" >&2
      exit 1
    }
  elif [ -e "$consumer" ]; then
    backup="${consumer}.pre-shared-skills-backup-$(date +%Y%m%d-%H%M%S)"
    mv "$consumer" "$backup"
    ln -s "$hub" "$consumer"
  else
    mkdir -p "$(dirname "$consumer")"
    ln -s "$hub" "$consumer"
  fi
done
```

The script deliberately stops on an unexpected symlink. Resolve its purpose before continuing; do not create a mesh of links between agents.

## Link this repository's skills

First classify every repo skill against the runtime hub:

```bash
repo="/path/to/agent-skills/skills"
hub="$HOME/.agents/skills"

for source in "$repo"/*; do
  [ -d "$source" ] || continue
  name="$(basename "$source")"
  target="$hub/$name"

  if [ ! -e "$target" ]; then
    printf '%s: missing from hub\n' "$name"
  elif [ -L "$target" ] && [ "$(readlink "$target")" = "$source" ]; then
    printf '%s: already linked\n' "$name"
  elif diff -qr "$source" "$target" >/dev/null; then
    printf '%s: identical directory\n' "$name"
  else
    printf '%s: CONFLICT — compare before replacing\n' "$name"
  fi
done
```

For a missing skill, create its link:

```bash
ln -s "/path/to/agent-skills/skills/<skill-name>" "$HOME/.agents/skills/<skill-name>"
```

For an identical or conflicting directory that you have decided the repository should replace, preserve the runtime copy first:

```bash
backup="$HOME/.agents/skills.pre-repo-link-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup"
mv "$HOME/.agents/skills/<skill-name>" "$backup/<skill-name>"
ln -s "/path/to/agent-skills/skills/<skill-name>" "$HOME/.agents/skills/<skill-name>"
```

Do not overwrite conflicting skills silently. Use `diff -ru <repo-skill> <hub-skill>` to review differences and choose which version becomes canonical. Leave skills that exist only in the hub alone unless you intentionally want to bring them into this repository.

## Keep skills current

Update this repository in place:

```bash
cd /path/to/agent-skills
git pull --ff-only
npm run validate
```

Existing per-skill links reflect the new contents immediately. After a pull that adds a new `skills/<skill-name>/` directory, run the classification command above and link the new skill if appropriate.

Use the [Vercel Skills CLI](https://vercel.com/docs/agent-resources/skills) to discover third-party skills, but review their source, attribution, and license before adding them to this repository or replacing an existing shared skill.

## Verify

```bash
readlink "$HOME/.codex/skills" "$HOME/.claude/skills" "$HOME/.cursor/skills"

for consumer in "$HOME/.codex/skills" "$HOME/.claude/skills" "$HOME/.cursor/skills"; do
  find "$consumer" -maxdepth 2 -name SKILL.md -print | sort
done
```

All three consumer paths should resolve to `~/.agents/skills`, and every linked repository skill should expose a `SKILL.md` through each path.

## Keep separate

- Do not import plugin caches, bundled skills, vendor checkouts, or Cursor's `skills-cursor` directory into the shared hub by default.
- Do not automatically link profile-specific skill folders from tools that support profiles.
- Keep timestamped backups until you have used the new setup successfully. Restore a skill by removing its symlink and moving the saved directory back; do not use destructive cleanup commands.
