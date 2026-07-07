---
type: Skill
name: phase-pr-review-loop
title: "Phase PR Review Loop"
description: Ship multi-phase engineering work as one-PR-per-phase with plan-first review, adversarial cross-agent code review, per-thread fix verification, and an honest phase status ledger. Use when executing a phased plan across sessions or agents, when asked to review or babysit a PR produced by another agent, when responding to review findings, or when deciding whether a phase is actually done. Pairs with the plan-writing skill.
resource: "https://github.com/dirtybits/agent-skills/tree/main/skills/phase-pr-review-loop"
tags: ["code-review", "pull-requests", "workflow", "multi-agent", "verification"]
timestamp: "2026-07-06T20:00:00Z"
okf_version: "0.1"
license: MIT
---

# Phase PR Review Loop

## Why this skill exists

Large changes shipped by agents fail in two characteristic ways: the plan drifts from what was built, and review findings get "fixed" in bulk without anyone verifying each fix. This loop prevents both. It has shipped multi-month, multi-agent migration work reliably because every unit is independently reviewable, every finding is closed with evidence, and a fresh session can take over by reading the ledger alone.

## 1. The loop

```
plan PR  →  plan review  →  implement (one phase = one branch)  →  phase PR
   →  reviewer briefing  →  findings as review threads
   →  fix each thread + reply with evidence  →  re-review  →  merge
   →  update the phase ledger  →  next phase
```

### Plan first, and review the plan as a PR

1. Non-trivial phases start as a `.plan.md` (see the plan-writing skill): goal, in/out scope, exact files, verification commands, done-when, rollback.
2. Open the plan itself as a PR **before implementation** and have a different agent (or the human) review it. Plan review is where scope creep, missing gates, and wrong sequencing get caught cheaply — a finding here costs minutes; the same finding post-implementation costs a rework cycle.
3. Dated notes in the plan override its original ordering. When implementation diverges, append a dated note at the point of divergence — never let the plan lie.

### One phase = one PR

4. Each phase lands as one PR off current `main`, on its own branch (`feat/<work>-phase-<N>`). Never stack multiple phases on a branch; the handoff boundary must be clean enough that a different session can take over between phases.
5. The PR description states: what the phase did, the verification that ran (commands + results), and **what was explicitly NOT verified** (e.g. "browser wallet smoke not run — tracked in the plan"). An honest "not verified" beats a false "done".

### Reviewer briefing

6. When handing a PR to a reviewing agent, write a briefing rather than "please review": the phase's goal, the invariants that must hold (link the plan section), the riskiest diff areas, what was already verified, and what the reviewer should try to break. Ask for adversarial review — findings the author would dispute are the valuable ones.
7. The reviewer posts findings as **inline review threads** (one finding per thread), each with: file/line, the defect stated as a failure scenario ("with input X, Y happens"), and severity. Vague findings ("could be cleaner") are comments, not threads.

### Per-thread fix verification (the load-bearing step)

8. Fix findings **one thread at a time**. For each thread: make the fix, run the narrowest check that proves it (a specific test, a repro command, a grep), and reply **on that thread** with the evidence (commit SHA + what was run + result) before resolving it.
9. Never batch-resolve threads with "all fixed". A thread without fix evidence is not closed. If a finding is rejected, reply with the reasoning and let the reviewer (or human) resolve it — the author does not unilaterally dismiss findings.
10. After all threads close, the reviewer does one more pass over the full diff (fixes introduce bugs too).

## 2. GitHub mechanics that trip agents up

- You **cannot APPROVE your own PR** (or a PR your account authored). When acting as reviewer on a same-account PR, leave a review comment with an explicit verdict line (e.g. "LGTM — all threads verified") instead of an Approve event.
- Submit structured reviews with `gh api repos/{owner}/{repo}/pulls/{n}/reviews -f event=COMMENT --input body.json` when you need inline comments; `gh pr review` alone cannot attach line comments.
- Read unresolved threads with GraphQL (`gh api graphql` on `reviewThreads` with `isResolved`), not just `gh pr view --comments` — top-level comments and review threads are different objects, and fix verification happens on threads.
- Reply on a thread via the review-comment reply endpoint (`gh api repos/{owner}/{repo}/pulls/{n}/comments -f body=... -F in_reply_to=<comment-id>`).
- `gh pr view <n> --json state,reviews,statusCheckRollup` is the truth for phase status — trust it and the plan ledger over prose in handoff messages.

## 3. The phase status ledger

Keep one authoritative record of phase status — the plan file's frontmatter todos plus dated body notes:

- `pending` / `in_progress` / `completed`, updated **as work happens**, not batched at session end.
- `completed` requires the phase's **done-when** to have passed: verification evidence, not compilation. If part of the done-when was deferred (e.g. a live smoke), the todo stays honest: either `in_progress`, or `completed` with the deferral named in the note and tracked in a later phase.
- Each completed phase's entry names its PR number and date, so `git log`, `gh pr view`, and the ledger cross-check each other.

## 4. Verification evidence standards

A phase PR's "verified" claim must be reproducible from the description alone:

- Exact commands run (lint/typecheck/tests/build) and their result counts.
- For live-flow phases: transaction hashes / request IDs / screenshots / balance deltas / DB rows — concrete artifacts, not "it works".
- Negative checks where they matter (the unauthorized path still rejects; the duplicate submit is idempotent).
- Anything not run is listed under "Not verified" with where it is tracked.

## 5. Done-when for this skill

The loop was followed when: the plan was reviewed before implementation; the phase landed as one PR with an honest verified/not-verified split; every review thread closed with per-thread fix evidence; the ledger's statuses match `gh pr view` reality; and a fresh session could pick up the next phase from the ledger without asking anyone.
