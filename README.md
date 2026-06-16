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

## Validate

```bash
npm run validate
```

## Publish Dry Run

```bash
AGENTVOUCH_KEYPAIR=~/test-keypair.json npm run publish:dry-run
```

Real publishing requires an explicit flag:

```bash
AGENTVOUCH_KEYPAIR=~/test-keypair.json npm run publish -- --apply
```

The publish script skips entries whose `publish_decision` is not `candidate`.
