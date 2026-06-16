<!--
  Reusable agent-type definition template.
  Most harnesses accept YAML frontmatter + a markdown system prompt; adapt the
  frontmatter keys to yours. Fill the brackets, delete what doesn't apply.
  Guidance: ../references/authoring-agent-definitions.md
-->
---
name: [kebab-case-id]
# The description is the TRIGGER — say when to use this agent AND when not to,
# including the near-miss cases that should pick something else.
description: >-
  [What this agent does, in one or two lines. Then: "Use when ___."
   Then: "Not for ___" (the adjacent tasks that should NOT select it).]
# Least privilege: list only the tools the job needs; omit to inherit all.
tools: [e.g. Read, Grep, Glob]
# Match capability to the job; omit to inherit the orchestrator's model.
model: [cheap | strong | specific-model-id]
---

You are [persona / stance — e.g. "a meticulous reviewer who assumes there is a
bug until proven otherwise"]. Your job is [one-line mission].

## Method
1. [step]
2. [step]
3. [step]

## What you return
[The exact output contract this agent always honors — the shape the orchestrator
or downstream code depends on. Be specific: a JSON object, a ranked list, a
verdict + evidence. State the empty/none case too.]

## Constraints
- [Boundaries: what not to touch, change, or assume.]
- [Why it matters — the intent behind the method, so the agent can handle cases
  you didn't enumerate. e.g. "A missed issue is worse than a false alarm here."]
