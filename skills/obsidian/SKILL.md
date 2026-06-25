---
type: Skill
title: "Obsidian"
resource: "https://github.com/dirtybits/agent-skills/tree/main/skills/obsidian"
tags: ["obsidian", "notes", "vault", "knowledge-management", "workflow"]
timestamp: "2026-06-25T06:43:10Z"
okf_version: "0.1"
name: obsidian
description: Read, search, create, and edit notes in the Obsidian vault.
platforms: [linux, macos, windows]
license: MIT
---
# Obsidian Vault

Use this skill for filesystem-first Obsidian vault work: reading notes, listing notes, searching note files, creating notes, appending content, and adding wikilinks.

## Vault path

Use a known or resolved vault path before calling file tools.

The documented vault-path convention is the `OBSIDIAN_VAULT_PATH` environment variable, for example from `${HERMES_HOME:-~/.hermes}/.env`. If it is unset, use `~/Documents/Obsidian Vault`.

File tools do not expand shell variables. Do not pass paths containing `$OBSIDIAN_VAULT_PATH` to `read_file`, `write_file`, `patch`, or `search_files`; resolve the vault path first and pass a concrete absolute path. Vault paths may contain spaces, which is another reason to prefer file tools over shell commands.

If the vault path is unknown, `terminal` is acceptable for resolving `OBSIDIAN_VAULT_PATH` or checking whether the fallback path exists. Once the path is known, switch back to file tools.

## Read a note

Use `read_file` with the resolved absolute path to the note. Prefer this over `cat` because it provides line numbers and pagination.

## List notes

Use `search_files` with `target: "files"` and the resolved vault path. Prefer this over `find` or `ls`.

- To list all markdown notes, use `pattern: "*.md"` under the vault path.
- To list a subfolder, search under that subfolder's absolute path.

## Search

Use `search_files` for both filename and content searches. Prefer this over `grep`, `find`, or `ls`.

- For filenames, use `search_files` with `target: "files"` and a filename `pattern`.
- For note contents, use `search_files` with `target: "content"`, the content regex as `pattern`, and `file_glob: "*.md"` when you want to restrict matches to markdown notes.

## Create a note

Use `write_file` with the resolved absolute path and the full markdown content. Prefer this over shell heredocs or `echo` because it avoids shell quoting issues and returns structured results.

## Append to a note

Prefer a native file-tool workflow when it is not awkward:

- Read the target note with `read_file`.
- Use `patch` for an anchored append when there is stable context, such as adding a section after an existing heading or appending before a known trailing block.
- Use `write_file` when rewriting the whole note is clearer than constructing a fragile patch.

For an anchored append with `patch`, replace the anchor with the anchor plus the new content.

For a simple append with no stable context, `terminal` is acceptable if it is the clearest safe option.

## Targeted edits

Use `patch` for focused note changes when the current content gives you stable context. Prefer this over shell text rewriting.

## Scheduled vault review / lint workflow

When asked to run a periodic vault review, do more than browse recent files:

1. Read `log.md` and the vault schema (`CLAUDE.md` and/or `AGENTS.md`) first to recover current cleanup debt and indexing conventions.
2. Build a lightweight link graph across `*.md` files: collect Obsidian wikilinks, resolve by basename, count inbound links, and list unresolved targets. It is acceptable to use a short local Python script via `terminal` when file-tool-only scanning would be awkward.
3. Identify recent notes (mtime window from the request) and compare them against hub/index pages. New research, marketing briefs, reports, or archive entries commonly need a one-line link in the relevant `index.md`.
4. Patch missing index links when the target hub is obvious; do not only report the orphan. Re-run the scanner after edits and report the before/after orphan count.
5. Review `Agents/*/{Memory.md,personal-memory.md,User-Preferences.md}`. Update only durable agent context (last review state, persistent blockers/preferences), not every transient file seen.
6. If significant changes were made, prepend a concise `log.md` entry with the file count, links added, memory files touched, and remaining cleanup debt.
7. In the final report, keep it brief: changes made, remaining health issues, new content worth attention, and suggested next actions.

## Wikilinks

Obsidian links notes with `[[Note Name]]` syntax. When creating notes, use these to link related content.

For vault-health scans, normalize links to Obsidian basename form where practical. Path-style links that include folder names or `.md` extensions (for example `[[daily-tech-reports/report-2026-05-16.md]]`) can create false unresolved/orphan findings in simple scanners and are harder to maintain across note moves. Prefer `[[report-2026-05-16]]` when the basename is unique, or `[[Note Name|display text]]` for readability.
