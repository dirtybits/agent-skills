---
type: Reference
title: Knowledge Base Conventions
description: OKF-inspired conventions for Markdown skill packages and AgentVouch knowledge bundle management.
tags: [knowledge-base, okf, skills, agentvouch]
timestamp: 2026-06-22T19:13:38Z
okf_version: "0.1"
---

# Knowledge Base Conventions

This repository follows an OKF-inspired Markdown knowledge format: human-readable files, YAML frontmatter, git history, Markdown links, and permissive consumption.

## Concept files

Every skill entrypoint and meaningful reference document should include YAML frontmatter:

```yaml
---
type: Skill | Reference | Playbook | Workflow
title: Human-readable title
description: One sentence summary
resource: Optional canonical URL for this concept
tags: [tag-one, tag-two]
timestamp: 2026-06-22T19:13:38Z
okf_version: "0.1"
---
```

`type` is the only OKF-required field for concept documents, but this repo expects `title` or `name`, `description`, and list-style `tags` for publishable skill packages.

## Reserved files

Reserved filenames have special meaning and are not treated as concept documents:

- `index.md`: directory listing for progressive disclosure.
- `log.md`: chronological semantic update history.

The root `index.md` may include frontmatter declaring bundle metadata. Other indexes should remain simple directory listings.

## Skill packages

A skill package lives at `skills/<skill-name>/` and should include:

- `SKILL.md` as the main entrypoint.
- `index.md` as the local directory index.
- `references/` for extended guidance and patterns when the skill is non-trivial.
- `assets/` for schemas, configs, or reusable structured files.
- `scripts/` for lightweight validation or repeatable checks.
- `LICENSE.txt` when the package license differs from repository defaults or should be explicit.

## Links

Use normal Markdown links as the knowledge graph:

- Prefer relative links for local files, such as `Guide -> references/GUIDE.md`.
- Use bundle-root links only when a consumer supports them.
- Add `# Citations` sections when a concept relies on external docs, APIs, or standards.

## Registry relationship

`registry.json` remains the AgentVouch publishing/control-plane file. Markdown frontmatter should carry descriptive metadata. Validation should ensure registry entries and skill frontmatter agree on name, path, license, and tags where applicable.

## Consumption model

Consumers should be permissive:

- tolerate unknown `type` values
- preserve unknown frontmatter keys
- warn rather than crash on broken links
- synthesize indexes if missing

Producers and CI can be stricter for repo quality before publishing.
