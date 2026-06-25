---
type: Skill
title: "Software Development Workflows"
resource: "https://github.com/dirtybits/agent-skills/tree/main/skills/software-development-workflows"
tags: ["software-development", "debugging", "testing", "code-review", "workflow"]
timestamp: "2026-06-25T06:43:10Z"
okf_version: "0.1"
name: software-development-workflows
description: "Use when planning, debugging, testing, reviewing, simplifying, or spiking code changes across languages: systematic debugging, TDD, debugpy/Node inspectors, code cleanup, and implementation strategy."
version: 1.0.0
author: Hermes Agent + dirtybits
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [software-development, debugging, testing, tdd, code-review, refactoring, spike, node, python]
    related_skills: []
---
# Software Development Workflows

## Overview

This umbrella covers the class-level software engineering practices that guide code work: planning, root-cause debugging, test-driven development, interactive debuggers, pre-commit review, simplification, and throwaway spikes.

It does not replace project-specific instructions. Always inspect the repository, its tests, and its conventions before applying generic recipes.

## When to Use

- Debug failing tests, runtime bugs, build failures, or integration issues.
- Write tests before fixes or features.
- Use Python `pdb`/`debugpy` or Node `--inspect` for interactive diagnosis.
- Run a pre-commit review or simplify a change set.
- Validate an uncertain technical approach with a spike.
- Author or adjust Hermes skill files.

Do not touch protected slash-command skills such as `plan`; when planning only, use the protected planning entry point if available.

## Core Workflow

1. **Inspect before editing.** Read relevant files, errors, configs, and tests.
2. **Reproduce.** Run the smallest failing command and capture real output.
3. **Choose practice.** Debugging, TDD, debugger attachment, review, simplification, or spike.
4. **Make minimal changes.** Avoid broad refactors while fixing root causes.
5. **Verify.** Run targeted tests first, then broader checks appropriate to the repo.
6. **Summarize with evidence.** Report commands run, outputs, files changed, and residual risk.

## Labeled Subsections from Former Narrow Skills

### Systematic debugging

- No fixes before root cause. Read errors completely, reproduce, inspect recent changes, trace data flow, then form one hypothesis.
- If three attempted fixes fail, stop and question architecture instead of stacking a fourth patch.

### Test-driven development

- RED: write or expose a failing test for the behavior.
- GREEN: implement the smallest root-cause fix.
- REFACTOR: clean only after tests prove behavior.

### Python and Node debuggers

- Python: prefer targeted `pdb`/`debugpy` breakpoints after reproducing the failure; avoid sprinkling permanent prints.
- Node: use `--inspect`/Chrome DevTools protocol only when normal logs/tests are insufficient; verify the debug target and port.

### Pre-commit review and simplification

- Review staged/uncommitted diffs for correctness, security, tests, API compatibility, and accidental artifacts.
- Simplification should reduce complexity without changing behavior; verify with existing tests before and after.

### Spikes

- Spikes are disposable experiments with a narrow question and a time/complexity bound.
- Keep spike code separate from production until the result is understood and deliberately ported.

### Skill authoring

- Skills need valid YAML frontmatter, a class-level trigger description, actionable workflow, pitfalls, and verification.
- Prefer broad umbrellas with support files over one-session micro-skills.
- When a user asks for a "full" or publishable skill, do not stop at a single `SKILL.md`; include the package shape expected by the target repository when available: `references/` for extended guidance/patterns, `assets/` for schemas/config, and `scripts/` for lightweight validators or repeatable checks.
- If the user points to an existing skill as a quality bar, inspect it for structure and useful patterns, then improve the local skill with stronger domain-specific content rather than copying generic placeholder sections.
- For repo-backed skill libraries, update the registry/provenance metadata alongside the skill directory and run the repository's validation command before committing or reporting success.
- For Git-backed skill/KB repos, prefer OKF-style conventions when the repo is meant to be consumed by agents: every non-reserved Markdown concept gets frontmatter (`type`, title/name, description, tags, timestamp), `index.md` provides progressive disclosure, `log.md` records semantic history, internal Markdown links form the knowledge graph, and CI validates registry/frontmatter consistency plus broken internal links.
- Add or update a formatter/generator script when applying corpus-wide KB metadata/index changes, then run the formatter and validator before committing. Keep publishing metadata (for example `registry.json`) as the control plane, but make Markdown frontmatter self-describing enough for generic agents to consume without custom registry knowledge.
- For Markdown skill/KB repositories, prefer an OKF-inspired corpus shape: every meaningful concept document has YAML frontmatter with `type`, `title`/`name`, `description`, `tags`, and an ISO timestamp; reserved `index.md` files provide directory listings; `log.md` files capture semantic update history; normal Markdown links form the knowledge graph; citations point to external docs.
- When adding OKF-style conventions, make producers strict and consumers permissive: CI/validation can require complete metadata, registry/frontmatter consistency, reserved-file shape, and internal-link checks, while sync/publish consumers should tolerate unknown types/fields and warn rather than crash on optional gaps.
- If a skill publisher reads frontmatter for marketplace metadata, handle folded YAML values like `description: >-` instead of naively publishing the literal `>-`.
- For Markdown skill/KB repositories, prefer OKF-inspired conventions when compatible: every meaningful concept document gets YAML frontmatter with `type`, `title` or `name`, `description`, `tags`, `timestamp`, and optional `resource`/`okf_version`; reserved `index.md` files provide progressive disclosure and `log.md` files provide semantic update history.
- Add or update repo automation when introducing KB conventions: a formatter/generator for frontmatter and indexes, validation for concept metadata/internal links/registry consistency, and publish-script parsing that handles folded YAML values such as `description: >-`.

## Preserved Detail

Former standalone skill packages are preserved under `references/absorbed-packages/<skill-name>/` with their original relative layout. Treat that directory as the old skill root when consulting old support files.

## Verification Notes and Pitfalls

- For Vitest v4, Jest-style `--runInBand` is invalid, and older nested `--poolOptions...` flags may also be rejected. To serialize web tests, prefer `vitest run --maxWorkers=1 --no-fileParallelism` through the package script, for example `npm test --workspace <workspace> -- --maxWorkers=1 --no-fileParallelism`.
- If restoring missing Node dependencies with `npm install` changes only lockfile metadata unrelated to the task (for example optional package platform/libc churn), inspect and revert the lockfile before committing unless the dependency graph change is intentional.

## Verification Checklist

- [ ] Relevant source/config/test files were read.
- [ ] Failure or target behavior was reproduced where possible.
- [ ] Chosen workflow matches the job class.
- [ ] Changes are minimal and repo-conventional.
- [ ] Targeted and broader verification commands ran or blockers are explicit.

## Provenance and Attribution

This is a local Hermes Agent + dirtybits-created umbrella skill from Andy/dirtybits' Hermes environment. A 2026-06-25 provenance spike found no exact public web/GitHub/Hermes-repo match for `name: software-development-workflows`.

It consolidates older local software-development skills under `references/absorbed-packages/`. Preserve each absorbed package's original frontmatter, author, license, and attribution when redistributing. Notable adapted sources include `obra/superpowers`, `gsd-build/get-shit-done`, and Claude Code-inspired workflow patterns where cited in the absorbed files.
