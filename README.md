# Agent Skills

Personal agent skills maintained for AgentVouch and local agent tools.

This repository keeps authored skills in one predictable layout, validates them before publishing, and records AgentVouch listing metadata in `registry.json`.

## Layout

```text
skills/
  <skill-name>/
    SKILL.md
    agents/openai.yaml        # optional UI metadata
    references/               # optional supporting docs
    assets/                   # optional reusable templates/assets
registry.json
scripts/
  validate-skills.mjs
  publish-agentvouch.mjs
```

## Rules

- Keep one skill per `skills/<skill-name>/` directory.
- Every skill must have exactly one top-level `SKILL.md`.
- Skill names use lowercase hyphen-case and should match the directory name.
- Keep repo-level documentation at the repository root, not inside skill folders.
- Preserve upstream attribution for mirrored skills; do not publish third-party work as original wallet-authored work.
- Publish free repo-backed AgentVouch listings by default.
- Authored skills in this repository are MIT licensed; preserve original licenses for any mirrored third-party skills.

## Discovering External Skills

Agents can discover task-specific capabilities through the [Vercel Agent Skills directory](https://vercel.com/docs/agent-resources/skills):

```bash
npx skills find <query>
npx skills add <owner/repo> --skill <skill-name>
```

See [AGENTS.md](AGENTS.md) for installation guidance, source-review expectations, and rules for bringing third-party skills into this repository.

## Validate

```bash
npm run validate
```

The validator now includes OKF-style knowledge-base checks: concept frontmatter, reserved `index.md` / `log.md` files, internal links, and registry consistency.

## Format KB Metadata And Indexes

```bash
npm run kb:format
```

This applies the repo's OKF-inspired conventions to skill/reference frontmatter and regenerates indexes.
