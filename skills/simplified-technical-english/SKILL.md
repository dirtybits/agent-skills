---
type: Skill
name: simplified-technical-english
title: "Simplified Technical English"
description: "Write and revise technical content so labels, headings, instructions, plans, status names, error messages, identifiers, and Git branches are clear without hidden context. Use when creating or reviewing technical documentation, operational procedures, UI labels, project phases or gates, issue and PR titles, and branch names; especially when text contains unexplained shorthand, vague labels, long instructions, inconsistent terms, or branches such as work/updates that do not identify the change type and topic."
resource: "https://en.wikipedia.org/wiki/Simplified_Technical_English"
tags: [documentation, technical-writing, naming, git, workflow]
timestamp: "2026-08-01T11:35:55Z"
okf_version: "0.1"
license: MIT
---

# Simplified Technical English

Use clear, controlled technical English. Make each label and instruction understandable without
private context. Preserve technical accuracy while reducing ambiguity.

## Core Rules

1. **Name the topic in every label.** Make a heading, gate, phase, mode, or status understandable in
   isolation.
   - Use: `Base Sepolia Gate A — Pre-deployment verification`.
   - Do not use: `Gate A`.
   - Use: `Stripe Checkout Phase 2 — Webhook reconciliation`.
   - Do not use: `Phase 2`.
2. **Use one term for one meaning.** Select a canonical term and use it consistently. Do not switch
   between synonyms such as `report`, `claim`, and `dispute` unless they identify different objects.
3. **Use one topic per paragraph.** Split mixed requirements, explanations, and exceptions into
   separate paragraphs or lists.
4. **Write one action per instruction.** Use active voice and name the actor when ownership matters.
5. **Put the condition before the action.** Use: `If verification fails, keep the deployment paused.`
6. **Use short wording.** Prefer short sentences and familiar words. Remove filler that does not
   change the requirement.
7. **Use vertical lists for complex information.** Put each condition, action, or result on its own
   line.
8. **Explain shorthand at first use.** Pair required codes with their topic:
   `Base Mainnet Requirement A1 — Voucher slashing`. Do not invent a new acronym for a term used only
   a few times.
9. **Preserve exact technical identifiers.** Keep code symbols, commands, environment variables,
   protocol versions, and external identifiers unchanged inside code formatting. Add a plain-language
   explanation next to them.
10. **State limits explicitly.** Say what an approval, test, flag, or status permits and what it does
    not permit.

## Label Pattern

Use this pattern when a sequence identifier is necessary:

```text
<scope> <kind> <identifier> — <topic>
```

Examples:

- `Base Sepolia Deployment Gate B — Paused deployment`
- `Base Mainnet Requirement A3 — Emergency pause and role custody`
- `Wallet Connection Test 4 — Reconnect after session expiry`
- `Database Migration Mode 2 — Apply guarded schema changes`

Omit the identifier when it provides no operational value. Use `Wallet reconnect test` instead of
adding an arbitrary number.

## Instruction Pattern

Write procedures in this order:

1. State the condition or prerequisite.
2. Give one action.
3. State the expected result.
4. State the stop condition or rollback action when risk exists.

Use direct commands:

- Use: `Verify the contract address. Then enable the preview flag.`
- Do not use: `Once everything looks good, proceed with activation as appropriate.`

## Git Branch Names

Inspect the repository instructions before creating a branch. Follow a required namespace or branch
format when one exists.

When the repository does not specify a format, use:

```text
<change-type>/<specific-topic>
```

Select the change type from the work:

- `fix/` for a defect or incorrect behavior.
- `feat/` for a new user or system capability.
- `docs/` for documentation-only work.
- `refactor/` for a behavior-preserving code restructure.
- `test/` for test-only work.
- `ci/` for build or automation changes.
- `chore/` for maintenance that does not fit another type.

Use a short kebab-case topic that names the affected behavior:

- Use: `fix/wallet-connect-button-handling`.
- Use: `docs/base-sepolia-gate-labels`.
- Use: `feat/stripe-walletless-purchases`.
- Do not use: `fixes`, `updates`, `misc-work`, `gate-a`, or `issue-123`.

If the environment requires an agent namespace, keep the same type and topic after it. Example:
`codex/fix/wallet-connect-button-handling`.

Do not use an agent name, ticket number, phase number, or acronym as the only topic.

## Revision Workflow

1. Identify the audience and the action they must take.
2. List labels and shorthand that require hidden context.
3. Define one canonical term for each concept.
4. Rewrite labels before rewriting their supporting text.
5. Split long instructions and mixed-topic paragraphs.
6. Preserve technical identifiers and factual meaning.
7. Check each label without its surrounding paragraph.
8. Check branch names against the repository rules and the actual change type.

## Completion Check

- Confirm that each label names its scope and topic.
- Confirm that each instruction contains one primary action.
- Confirm that each acronym or sequence code has an explanation.
- Confirm that the same term has the same meaning throughout the artifact.
- Confirm that safety boundaries and approval limits are explicit.
- Confirm that the branch name identifies both the change type and the specific topic.
- Confirm that the revision did not rename code identifiers or change behavior without authorization.

## Source and Scope

Use the clarity principles described in
[Simplified Technical English](https://en.wikipedia.org/wiki/Simplified_Technical_English): clear and
specific instructions, short sentences, active voice, vertical lists, and one topic per paragraph.
Treat this skill as STE-inspired writing guidance. Do not claim formal ASD-STE100 conformance or
apply its controlled dictionary unless the user supplies the official standard and requests strict
compliance.
