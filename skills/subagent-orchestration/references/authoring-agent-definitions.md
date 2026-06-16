# Authoring reusable agent definitions

A one-off prompt spawns a sub-agent *now*. An **agent definition** is a saved,
named agent *type* the harness can select on its own whenever a matching task
shows up — a code reviewer, a security auditor, a docs explorer. Promote a prompt
to a definition once you've spawned roughly the same agent two or three times.

Harnesses store these differently (a markdown file with YAML frontmatter, a JSON
entry, a registry API), but the same four ingredients decide whether the
definition is any good.

## 1. description — this is the trigger

The orchestrator decides whether to use an agent type by reading its
description, the same way a skill is matched. So the description must say,
precisely, **when to use this agent and when not to** — not just what it is.

State the positive triggers (the situations and phrasings that should select it)
*and* the near-misses that shouldn't, because the adjacent-but-wrong cases are
exactly where misfires happen.

**Weak:** `Reviews code.`
**Strong:** `Reviews a diff or set of changed files for correctness bugs,
security issues, and missing edge cases. Use after implementing a feature or
before opening a PR, when the user asks to "review", "check my changes", or
"look for bugs". Not for writing new code, explaining how existing code works,
or broad architecture questions.`

## 2. system prompt — persona, method, and output contract

The body of the definition is a standing system prompt. Give it:
- **Persona / stance** — "a meticulous reviewer who assumes there's a bug until
  proven otherwise" sets behavior more effectively than a checklist.
- **Method** — the steps or order of operations this agent should follow every
  time.
- **Output contract** — the shape it always returns, since downstream code or
  the orchestrator depends on it. Pin this down once here instead of repeating
  it in every spawn.

Explain the *why* behind the method. A definition that says "we block releases on
these findings, so a false negative is worse than a false positive — flag
anything you're unsure about" produces better judgment than ten rigid rules,
because the agent can reason about cases you didn't enumerate.

## 3. tool scoping — least privilege

Give the agent only the tools its job needs. This is both a safety boundary and
a focusing device:
- A **read-only** reviewer or explorer should not have write/edit/delete or
  shell access — it can't accidentally mutate anything, and it won't wander into
  "fixing" what it was asked to assess.
- A **search** agent needs read + grep/glob, not the ability to run arbitrary
  commands.
- An **implementer** needs edit and shell, but scope it to the task.

Narrower tools also make the agent's behavior more predictable, because there are
fewer ways for it to go off-task.

## 4. model — match capability to the job

If your harness lets a definition pin a model, use it deliberately:
- **Cheap / fast** for mechanical, high-volume fan-out — searching, extracting,
  classifying, simple transforms. You'll run many of these; cost adds up.
- **Strong** for judgment, synthesis, adversarial verification, planning — work
  where a wrong answer is expensive and reasoning quality dominates.

When unsure, inherit the orchestrator's model rather than guessing.

## Skeleton

See `assets/agent-definition-template.md` for a fill-in-the-blanks version. The
shape most harnesses accept:

```markdown
---
name: <kebab-case-id>
description: <when to use, when not to — this is the trigger>
tools: <least-privilege list, or omit to inherit all>
model: <cheap | strong | specific-id, or omit to inherit>
---

You are <persona>. Your job is <one-line mission>.

## Method
1. <step>
2. <step>

## What you return
<exact output contract — the shape the orchestrator can rely on>

## Constraints
- <boundaries: what not to touch, assume, or do>
```

## Two quick examples

**Read-only explorer** (cheap model, no write tools):
```markdown
---
name: repo-explorer
description: >-
  Searches the codebase to answer "where / how / does X exist" questions across
  many files. Use for broad fan-out lookups when you want the conclusion, not
  the file contents. Not for editing code or deep single-file analysis.
tools: Read, Grep, Glob
model: cheap
---
You are a fast codebase scout. Find what's asked across the whole repo, reading
only enough of each file to confirm relevance.

## What you return
A list of `file:line → one-line note`. No file dumps, no preamble. If nothing
matches, say so plainly.
```

**Adversarial verifier** (strong model):
```markdown
---
name: claim-verifier
description: >-
  Independently tries to REFUTE a specific finding or claim before it's acted
  on. Use inside review/audit workflows to filter false positives. Not a general
  reviewer — it judges one claim at a time.
model: strong
---
You are a skeptic. Assume the claim is wrong until the evidence forces otherwise;
a false "confirmed" is worse than a false "refuted".

## What you return
`{ verdict: confirmed | refuted | uncertain, evidence: "...", confidence: 0-1 }`
```
