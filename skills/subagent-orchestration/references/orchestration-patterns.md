---
type: Reference
title: "Subagent Orchestration Orchestration Patterns"
description: "Reference material for the Subagent Orchestration skill."
resource: "https://github.com/dirtybits/agent-skills/blob/main/skills/subagent-orchestration/references/orchestration-patterns.md"
tags: ["agents", "orchestration", "workflow", "prompting", "reference"]
timestamp: "2026-06-22T19:13:38Z"
okf_version: "0.1"
---
# Orchestration patterns

Composable shapes for coordinating sub-agents. Each entry: what it is, when to
reach for it, a tool-agnostic sketch, and the gotcha that usually bites people.

The sketches use a generic vocabulary you can map onto your harness:
- `spawn(prompt)` → start one sub-agent, await its final message
- `parallel([...thunks])` → run many concurrently, **wait for all** (a barrier)
- `pipeline(items, stageA, stageB, ...)` → push each item through all stages
  independently, **no barrier between stages**

---

## Fan-out / map

**What.** Run N independent tasks at once and collect the results.

**When.** The tasks share no dependencies and you want every result together —
review each file in a diff, research each subtopic, audit each endpoint.

```
const results = await parallel(
  items.map(item => () => spawn(promptFor(item)))
)
const ok = results.filter(Boolean)   // sub-agents can return null — filter
```

**Gotcha.** A barrier costs you the slowest item. If results feed a *next*
stage, prefer a pipeline so fast items don't idle waiting for the slow one.

---

## Pipeline

**What.** Each item flows through every stage on its own; nothing waits at a
stage boundary. Item A can be in stage 3 while item B is still in stage 1.

**When.** The default for any multi-stage per-item work. Wall-clock becomes the
slowest single chain, not the sum of each stage's slowest item.

```
const out = await pipeline(
  files,
  file   => spawn(`Review ${file} for bugs. Return findings as JSON.`),
  review => spawn(`Adversarially verify these findings: ${review}`)
)
```

**Gotcha.** Reach for a barrier only when a stage genuinely needs the *whole*
previous set — e.g. dedup across all findings before expensive verification, or
"if zero findings, skip verification entirely". "I need to flatten/map/filter
first" is not a reason for a barrier; do that transform inside a stage.

---

## Adversarial verify

**What.** Before trusting a finding or plan, spawn independent skeptics whose
job is to *refute* it. Keep it only if it survives a majority.

**When.** Plausible-but-wrong outputs are costly — bug reports, security claims,
architectural decisions. Independent refutation filters them.

```
const votes = await parallel(
  range(3).map(() => () =>
    spawn(`Try to REFUTE this claim: "${claim}".
           Default to refuted=true if uncertain. Return {refuted, why}.`))
)
const survives = votes.filter(v => v && !v.refuted).length >= 2
```

**Gotcha.** Prompt the skeptics to default toward rejection; a verifier that
wants to agree confirms everything and tells you nothing.

---

## Perspective-diverse verify

**What.** When a claim can fail in more than one way, give each verifier a
*different* lens instead of running identical skeptics.

**When.** The thing under test has distinct failure modes — e.g. a fix can be
wrong (correctness), unsafe (security), slow (perf), or simply not reproduce.

```
const lenses = ['correctness', 'security', 'performance', 'does-it-reproduce']
const checks = await parallel(
  lenses.map(lens => () =>
    spawn(`Judge "${claim}" strictly through the ${lens} lens. Return {pass, why}.`))
)
```

**Gotcha.** Diversity beats redundancy here. Three identical correctness checks
miss the security hole that one security-lensed check would catch.

---

## Judge panel

**What.** Generate N independent attempts from different angles, score them with
judges, then synthesize from the winner while grafting the best ideas of the
runners-up.

**When.** The solution space is wide and one-shot-then-iterate tends to lock in
the first idea — design proposals, naming, API shape, strategy.

```
const angles = ['MVP-first', 'risk-first', 'user-first']
const attempts = await parallel(angles.map(a => () =>
  spawn(`Propose a solution to <problem> from a ${a} angle.`)))
const scores = await parallel(attempts.map(x => () =>
  spawn(`Score this proposal 1-10 on <criteria>, with reasons: ${x}`)))
// synthesize from the top-scored, pulling in good ideas from the rest
```

**Gotcha.** The angles must be genuinely different. Three variations on the same
idea give you a false sense of having explored the space.

---

## Loop-until-dry

**What.** For discovery of unknown size, keep launching finders until K
consecutive rounds surface nothing new.

**When.** You can't know up front how many bugs / edge cases / dead files exist.
A fixed "run 3 finders" misses the tail; looping until dry converges on it.

```
const seen = new Set()
let dryRounds = 0
while (dryRounds < 2) {
  const found = (await spawn(`Find issues not in this list: ${[...seen]}`)).items
  const fresh = found.filter(i => !seen.has(key(i)))
  if (!fresh.length) { dryRounds++; continue }
  dryRounds = 0
  fresh.forEach(i => seen.add(key(i)))
}
```

**Gotcha.** Dedup against *everything seen*, not just confirmed results — or
rejected items reappear every round and the loop never terminates.

---

## Multi-modal sweep

**What.** Parallel agents each search a *different way* — by container, by
content, by entity, by time — because one angle alone has blind spots.

**When.** Comprehensive discovery where you suspect a single query won't surface
everything (security review, "find every caller", incident forensics).

```
const angles = [
  'by file/dir naming conventions',
  'by string/content grep',
  'by entity (functions, classes, routes)',
  'by recent git history',
]
const hits = await parallel(angles.map(a => () =>
  spawn(`Find <target>, searching ${a}. Return file:line list.`)))
```

**Gotcha.** Each agent is blind to the others; expect overlap and dedup the
union.

---

## Completeness critic

**What.** A final agent whose only job is to ask "what's missing?" — an
unread source, an unverified claim, a search angle never run. Its findings seed
the next round.

**When.** High-stakes thoroughness, as the last gate before you call something
done.

```
const gaps = await spawn(`Here is everything we covered: ${summary}.
  What's missing — a modality not searched, a claim not verified, a file not
  read? Return a list of concrete gaps, or "none".`)
```

**Gotcha.** Only useful if you actually act on the gaps. Treat its output as a
work-list, not a rubber stamp.

---

## Orchestrator-worker

**What.** One planner decomposes a large task into pieces, workers execute the
pieces in parallel, and the planner (or a synthesizer) recombines the results.

**When.** Big tasks with a natural decomposition — migrations, multi-section
reports, codebase-wide refactors.

```
const plan    = await spawn(`Break <task> into independent units of work. Return a list.`)
const done    = await parallel(plan.units.map(u => () => spawn(workerPrompt(u))))
const summary = await spawn(`Synthesize these results into <deliverable>: ${done}`)
```

**Gotcha.** Keep it one level deep. Workers that spawn their own workers turn
failures opaque and coordination cost super-linear — flatten unless depth is
genuinely required.

---

## Composing patterns

Real workflows chain these. A thorough review might be: **multi-modal sweep**
(find candidates) → dedup at a barrier → **perspective-diverse verify** (judge
each) → **completeness critic** (what did we miss?) → loop if it found gaps.
Start from the simplest shape that fits and add a stage only when a real failure
mode justifies it.
