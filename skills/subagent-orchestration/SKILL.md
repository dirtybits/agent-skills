---
type: Skill
name: subagent-orchestration
title: "Subagent Orchestration"
description: "Best practices for delegating work to sub-agents — when to spawn one vs. work inline, how to write self-contained prompts, orchestration patterns, and how to author reusable agent-type definitions."
resource: "https://github.com/dirtybits/agent-skills/tree/main/skills/subagent-orchestration"
tags: ["agents", "orchestration", "workflow", "prompting"]
timestamp: "2026-06-22T19:13:38Z"
okf_version: "0.1"
license: "all-rights-reserved"
---
# Sub-agent Orchestration

A sub-agent is a fresh context window with its own tools that does one scoped
task and returns a **single final message**. The agent that spawned it (the
*orchestrator*) sees only that final message — never the sub-agent's
intermediate reads, greps, or reasoning. That one fact drives almost every
decision below, so hold onto it:

> The orchestrator pays for the sub-agent's *conclusion*, not its *work*.

Harnesses name this primitive differently — a `Task` tool, an `Agent` tool, a
"subagent", a `Workflow` step — but the contract is the same everywhere. This
skill is written to that contract, not to any one tool. Substitute your
harness's spawn mechanism wherever you see "spawn a sub-agent".

Most agents get the balance wrong in *both* directions: they under-delegate
broad searches and parallelizable work (doing serially, inline, what should
fan out), and they over-delegate trivial lookups (spawning a whole agent to
read one known file). The goal here is to get the balance right.

---

## The one-line test

**Delegate when the work is large to do but small to report, or independent
enough to run in parallel. Keep it inline when you need the details rather than
a summary, when the steps depend on each other turn-by-turn, or when it's
faster to just do it than to describe it.**

Everything below is that test, expanded.

---

## When to spawn a sub-agent

**1. Fan-out search / exploration.** The question can only be answered by
sweeping many files, directories, or naming conventions, and you want the
*conclusion*, not the raw material. "Where is auth enforced across this
monorepo?" → an explorer reads 40 files and returns a 15-line map. Your context
grows by 15 lines, not 40 files.

**2. Independent work that can run in parallel.** N items with no
cross-dependencies — review 8 changed files, research 5 topics, audit 12
endpoints. Spawn them concurrently and wall-clock collapses to the slowest
single item instead of the sum.

**3. Large-but-disposable intermediate output.** Any task whose byproducts are
huge but whose payload is small: tailing logs to find the one stack trace,
running a test suite to extract the failures, scanning a dataset for outliers.
Isolation keeps the noise out of your context.

**4. A fresh, unanchored perspective.** Review, security audit, adversarial
verification. You may be anchored on the approach you just wrote; an agent that
never saw it isn't. Independence is the feature.

**5. Scale beyond one context window.** Migrations, audits, and sweeps too large
to hold at once. Decompose, fan out, and each piece fits in its own context.

## When NOT to spawn a sub-agent

**1. You already know where the answer is.** A single known file, symbol, or
line — just read it. Spawning adds spawn latency, a prompt you have to write,
token cost, and a return you have to parse, all to avoid one `Read`.

**2. You need the details, not a summary.** If you'll keep working with the
*specifics* the task surfaces, isolating them throws away exactly what you need
— the returned summary is lossy by design. Delegation is for when the summary
*is* the goal.

**3. The steps depend on each other turn-by-turn.** Sub-agents can't coordinate
mid-flight: they start blank, share no memory, and you can't watch their work
as it unfolds. If step B needs nuanced output from A which needs B's result,
do it inline or model it as an explicit pipeline — don't try to choreograph
chatty agents.

**4. It's trivial.** If the whole task is two tool calls, orchestration overhead
exceeds the work. Just do it.

**5. Describing it costs more than doing it.** If writing a self-contained
prompt would take longer than the task itself, that's the signal to stay inline.

**6. It only makes sense with your conversation history.** The agent can't see
this conversation. Either inline it, or first ask whether the needed context can
even be distilled into a prompt — often it can't.

---

## How orchestration actually works

**The return is data, not chat.** The final message is consumed by you (or a
script), and is *not shown to the user*. Tell the sub-agent this, ask for a
specific shape (a list, structured fields, a verdict + evidence), and keep it
dense. Then **relay what matters to the user yourself** — they never saw it.

**Prompts must be self-contained.** The sub-agent has none of your context.
Every path, constraint, definition of done, and relevant fact has to be in the
prompt. See `references/writing-subagent-prompts.md` and the ready-to-fill
`assets/subagent-prompt-template.md`.

**Parallel vs. sequential is a real choice:**
- *Parallel barrier* — spawn all, wait for all, then proceed. Use only when you
  genuinely need every result together (to dedup, merge, or make an
  all-or-nothing call).
- *Pipeline* — each item flows through stages independently; item A can be in
  stage 3 while item B is still in stage 1. This is the **default** for
  multi-stage work, because wall-clock becomes the slowest single chain rather
  than the sum of each stage's slowest item.

**Sub-agents aren't free, and they can fail.** Each one burns tokens and time;
scale the fleet to the task ("find any bug" is a couple of finders, "exhaustively
audit this" is a larger pool plus verification). Any sub-agent may return junk or
nothing — filter empty results, and for unknown-size work, loop until rounds come
back empty rather than assuming one pass was complete.

**Never truncate silently.** If you cap coverage (top-N, sampling, no retries),
say so in your summary. A partial sweep that's reported as complete is worse than
no sweep, because it stops anyone from looking further.

**Don't double-do work.** Once you've delegated a search, don't also run it
yourself — wait for the result. And keep nesting shallow: agents spawning agents
spawning agents multiplies coordination cost and makes failures opaque. Prefer a
flat fan-out with one orchestrator unless depth is truly warranted.

---

## Orchestration patterns

Pick by task; compose freely. Sketches and when-to-use notes for each are in
**`references/orchestration-patterns.md`** — read it when you're designing a
workflow with more than one stage.

| Pattern | Use it when |
|---|---|
| **Fan-out / map** | Independent tasks; you want all results collected. |
| **Pipeline** | Multi-stage work; stages shouldn't block each other. |
| **Adversarial verify** | A finding/plan must survive skeptics before you act. |
| **Perspective-diverse verify** | A claim can fail multiple ways — give each verifier a distinct lens. |
| **Judge panel** | Wide solution space; generate N approaches, score, synthesize. |
| **Loop-until-dry** | Unknown-size discovery; stop after K empty rounds. |
| **Multi-modal sweep** | One search angle won't find everything; search several ways at once. |
| **Completeness critic** | Final pass asks "what's missing?" → seeds the next round. |
| **Orchestrator-worker** | Planner decomposes, workers execute, planner synthesizes. |

Scale to the request: "quick check" → a few finders, single-vote verify.
"Be thorough / audit this" → larger pool, 3–5 vote adversarial pass, a synthesis
stage.

---

## Writing the sub-agent prompt

A sub-agent's output is only as good as how completely you briefed it. A strong
prompt has, in roughly this order: **task** (one line), **context** (everything
it needs, since it has none), **inputs** (paths, scope, data), **constraints**
(what *not* to touch or assume), **definition of done**, **return format**
(explicit), and an **effort dial** (e.g. "medium exploration" vs. "exhaustive").

Full guidance: `references/writing-subagent-prompts.md`.
Copy-paste starting point: `assets/subagent-prompt-template.md`.

---

## Authoring reusable agent definitions

When the same kind of sub-agent recurs — a code reviewer, a security auditor,
a docs explorer — promote it from an ad-hoc prompt to a **named agent
definition** the harness can select automatically. The four things that make a
good definition:

- **description** — this is the *trigger*. State precisely when this agent
  should be chosen and when it shouldn't, since that's what the orchestrator
  matches against.
- **system prompt** — persona, methodology, and the output contract it always
  honors.
- **tool scoping** — least privilege. A read-only reviewer should not hold
  `Write`/`Edit`; a search agent doesn't need shell access. Narrow tools make
  the agent safer and more focused.
- **model** — match capability to job. A cheap, fast model for mechanical
  fan-out; a strong model for judgment, synthesis, or adversarial work.

Full guidance: `references/authoring-agent-definitions.md`.
Template: `assets/agent-definition-template.md`.
Orchestration-script scaffold (for harnesses with a workflow runner):
`assets/workflow-script-template.js`.

---

## Worked examples

**Delegate — broad sweep, small payload.**
> *"Where do we read AWS credentials anywhere in this repo?"*
Spawn one exploration sub-agent: *"Search the entire repo for where AWS
credentials are read (env vars, config files, SDK calls, hardcoded keys). Return
a list of `file:line → how it's accessed`. Medium-thorough. Your output is
consumed programmatically — just the list, no preamble."* You get a map; your
context stays clean.

**Don't delegate — known target.**
> *"Rename `getUser` to `fetchUser` in `src/api/user.ts`."*
You know the file. Read and edit it inline. Spawning an agent here is pure
overhead.

**Delegate in parallel, then verify — a review.**
> *"Review the 6 files in this diff for bugs."*
Pipeline: one reviewer per file (fan-out), and as each review lands, spawn a
skeptic to adversarially verify its findings before you trust them. File 1's
findings get verified while file 5 is still under review — no wasted wall-clock.
Collect confirmed findings, then relay them to the user.

**Don't delegate — tight dependency.**
> *"Debug why this function returns undefined, then fix it."*
The fix depends on what you learn while debugging, which depends on what the fix
reveals. Keep it inline; you need the details live, not a summary.

---

## Anti-patterns to avoid

- **Spawn-and-also-do-it-yourself.** Delegating a search and then running it
  inline anyway. Wait for the result.
- **Under-briefed prompts.** Forcing the sub-agent to guess paths, scope, or
  intent it has no way to know.
- **Treating chatty prose as the answer.** Extract the data; don't paste the
  sub-agent's conversational reply at the user.
- **Over-decomposition.** Twenty agents for a three-file change.
- **Deep nesting by default.** Agents spawning agents spawning agents when a
  flat fan-out would do.
- **Forgetting the user is blind to it.** The sub-agent's output went to you,
  not them — summarize the outcome.
- **Silent caps.** Reporting a sampled or top-N sweep as if it were exhaustive.
