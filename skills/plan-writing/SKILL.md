---
type: Skill
name: plan-writing
title: "Plan Writing"
description: Write, review, and maintain implementation-ready .plan.md files with YAML frontmatter, actionable TODO lists, concrete execution details, verification gates, and rollback notes. Use when creating, splitting, reviewing, or updating plan files, especially files under .agents/plans or .cursor/plans — and also whenever implementing or executing work from an existing .plan.md, so todo statuses and the plan body stay current as steps complete.
resource: "https://github.com/dirtybits/agent-skills/tree/main/skills/plan-writing"
tags: ["planning", "documentation", "project-management"]
timestamp: "2026-06-22T19:13:38Z"
okf_version: "0.1"
license: "all-rights-reserved"
---
# Plan Writing

## Instructions

When writing or reviewing a plan file:

1. Use the `.plan.md` extension.
2. When the user does not specify a location, default to `<repo>/.agents/plans/`; if the repo already has an established plans directory such as `.cursor/plans/`, follow that local convention.
3. Start with YAML frontmatter containing `name`, `overview`, `todos`, and `isProject`.
4. Make `todos` a short execution checklist with stable lowercase hyphenated `id` values, concrete `content`, and `status: pending`.
5. After frontmatter, write the plan body in Markdown.
6. Include enough repo-specific detail that another agent can implement without guessing.
7. Separate implementation steps from validation, rollout, and rollback when the work has operational risk.
8. Prefer exact files, commands, config keys, target hosts, acceptance criteria, and blockers over broad intent.
9. Do not hide open questions. Add an assumptions or blockers section when requirements are uncertain.
10. Date design decisions and verified claims (e.g. "verified 2026-06-09"), so a later session knows how stale they might be.

## Executing a Plan

A plan file is shared state across sessions and agents: a resumed or parallel session decides what to do next by reading the todo statuses. Stale statuses cause redone or skipped work, so maintain them as part of the implementation itself, not as cleanup afterward.

- Statuses are `pending`, `in_progress`, and `completed`.
- Set a todo to `in_progress` when starting it, and to `completed` as soon as its work is done and verified — not in a batch at the end of the session. If the session dies mid-plan, the file should still show exactly where things stood.
- Only mark `completed` when the step truly finished, including its verification. A step that ended in failing tests or partial work stays `in_progress`.
- If a step turns out to be unnecessary or is superseded, do not leave it `pending` forever and do not silently delete it — mark it `completed` with a brief note appended to its `content` (e.g. "— superseded by X"), so the record stays honest.
- When implementation diverges from the plan body (a design changes, an edge case forces a different approach), update the body with a short dated note at the point of divergence. The plan should describe what was actually built; a plan that lies is worse than no plan.
- When the last todo completes, give the body a final pass: blockers that materialized, follow-ups discovered during implementation, and anything the next reader needs.

## Frontmatter Template

```yaml
---
name: short-plan-name
overview: "One sentence describing the outcome, scope, and implementation context."
todos:
  - id: first-step
    content: Concrete task written as an implementation action
    status: pending
  - id: verify-result
    content: Run the checks that prove the plan worked
    status: pending
isProject: false
---
```

## Body Template

```markdown
# Plan Title

## Goal
State the desired end state in one short paragraph.

## Scope
- In scope: concrete systems, files, and behaviors.
- Out of scope: tempting but intentionally deferred work.

## Files To Change
- `path/to/file`: exact change expected.

## Implementation Steps
- Step-by-step changes in execution order.

## Verification
- Commands, checks, logs, and acceptance criteria.

## Rollout
- Canary or batch sequence when applicable.

## Rollback
- How to safely undo or disable the change.

## Blockers
- Conditions that should stop implementation or rollout.
```

## Quality Bar

- The TODO list should match the plan body.
- The plan should name the repo's existing patterns instead of inventing new ones.
- Verification should prove behavior, not just formatting.
- Rollback should avoid unrelated destructive changes.
- Keep the plan concise, but remove ambiguity before removing detail.
- After execution, statuses and body reflect what actually happened, not what was originally intended.
