---
type: Reference
title: "Subagent Orchestration Writing Subagent Prompts"
description: "Reference material for the Subagent Orchestration skill."
resource: "https://github.com/dirtybits/agent-skills/blob/main/skills/subagent-orchestration/references/writing-subagent-prompts.md"
tags: ["agents", "orchestration", "workflow", "prompting", "reference"]
timestamp: "2026-06-22T19:13:38Z"
okf_version: "0.1"
---
# Writing sub-agent prompts

A sub-agent starts with a blank context. It cannot see this conversation, the
user's earlier messages, the files you've already read, or what you're
ultimately trying to accomplish. Whatever you don't put in the prompt, it has to
guess — and it will guess wrong in ways you won't see until you read the return.

So the quality of a sub-agent's output is bounded by the completeness of its
brief. Treat the prompt as a contract.

## Anatomy of a strong prompt

In roughly this order:

1. **Task** — one sentence stating the goal. Lead with it.
2. **Context** — everything the agent needs that it can't discover on its own:
   what this codebase/project is, why you're asking, any prior decisions that
   constrain the answer.
3. **Inputs** — exact paths, scope, data, IDs. Don't say "the config file";
   say `apps/web/next.config.ts`.
4. **Constraints** — what *not* to do, touch, or assume. Boundaries prevent the
   agent from wandering into adjacent work or making changes you'll have to undo.
5. **Definition of done** — what "finished" means, concretely.
6. **Return format** — the exact shape you want back (see below).
7. **Effort dial** — how hard to look. "Quick first-match" vs. "medium
   exploration" vs. "exhaustive, multiple naming conventions and locations".

You won't always need all seven, but run through them mentally — the ones you
skip are usually the ones that come back to bite you.

## The return is data, not conversation

The sub-agent's final message goes to *you* (or a script), not to the user. Say
so, and specify the shape. Vague asks get prose; precise asks get parseable
results.

State explicitly: **"Your final message is consumed programmatically. Return
only <the shape>, no preamble or sign-off."**

Good shapes to request:
- A list: `file:line → one-line description`
- Structured fields: `{ verdict: pass|fail, evidence: "...", confidence: 0-1 }`
- A verdict + reasoning: `REAL` / `NOT REAL`, then one paragraph of why
- A ranked set: top N, each with a score and justification

If you need to act on the result programmatically, request strict JSON (or use
your harness's structured-output mechanism, which validates and retries on
mismatch — far more reliable than parsing free text).

## Weak vs. strong

**Weak:**
> Look into the auth code and tell me if there are problems.

The agent doesn't know which auth code, what counts as a "problem", how broadly
to look, or what to return. It'll improvise all four.

**Strong:**
> Audit session-token handling in `apps/api/src/auth/` for security issues
> (missing expiry checks, tokens logged in plaintext, missing signature
> verification). Read every file in that dir; don't go outside it. For each
> issue return `{ file, line, issue, severity: low|med|high }`. If you find
> none, return `[]`. Your output is parsed by a script — JSON only, no prose.

Task, scope, what-to-look-for, boundary, return shape, and the empty case are
all pinned down.

## Give the "why", not just the "what"

Capable models use intent to make good judgment calls on the cases your prompt
didn't enumerate. A line like *"this feeds a migration that must not lose data,
so flag anything ambiguous rather than assuming"* does more than three extra
rules, because it lets the agent reason about novel situations the way you would.

## Calibrate effort explicitly

Agents otherwise default to a middle effort that's wrong as often as right.
- **Cheap/fast:** "Return the first match and stop."
- **Medium:** "Check the obvious locations and common naming conventions."
- **Exhaustive:** "Search multiple locations and naming conventions; assume
  there are stragglers in unexpected places; don't stop at the first hit."

Match the dial to the stakes. A throwaway lookup and a pre-release security
sweep deserve very different effort.

## Self-containment checklist

Before you spawn, reread the prompt as if you knew nothing about this session.
Can a stranger execute it correctly? If any of these is true, fix it first:
- It references "the file" / "this function" / "what we discussed" without
  naming them.
- It assumes the agent knows the project's purpose or conventions.
- It doesn't say what to return, or in what shape.
- It doesn't say how hard to look.
- Success is undefined — the agent can't tell when it's done.

See `assets/subagent-prompt-template.md` for a fill-in-the-blanks starting point.
