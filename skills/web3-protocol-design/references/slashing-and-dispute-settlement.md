---
type: Reference
title: "Slashing And Dispute Settlement Design"
description: "Design proportional penalties, restitution, incentives, claims, and staged settlement without accidental economic or lifecycle complexity."
resource: "https://github.com/dirtybits/agent-skills/blob/main/skills/web3-protocol-design/references/slashing-and-dispute-settlement.md"
tags: ["web3", "protocol-design", "slashing", "disputes", "restitution", "incentives", "threat-modeling"]
timestamp: "2026-07-10T03:03:42Z"
okf_version: "0.1"
---
# Slashing And Dispute Settlement Design

Use this reference for penalties, disputes, refund pools, reporter or keeper rewards, reserves, expiry, sweeps, and multi-transaction settlement.

## Contents

- [Start With The Minimum Mechanism](#start-with-the-minimum-mechanism)
- [Separate The Economic Ledgers](#separate-the-economic-ledgers)
- [Test Trigger And Penalty Proportionality](#test-trigger-and-penalty-proportionality)
- [Control Report Admission](#control-report-admission)
- [Define The Claim Model](#define-the-claim-model)
- [Keep A Complexity Ledger](#keep-a-complexity-ledger)
- [Design Staged Settlement](#design-staged-settlement)
- [Protect Finalization And Liabilities](#protect-finalization-and-liabilities)
- [Budget The Target Chain](#budget-the-target-chain)
- [Adversarial Test Matrix](#adversarial-test-matrix)
- [Design-Lock Checklist](#design-lock-checklist)

## Start With The Minimum Mechanism

State the core safety claim in one sentence. Then ask whether the mechanism needs each adjacent policy to make that claim true:

- restitution for harmed users
- reporter or challenger bounty
- permissionless keeper reward
- treasury or insurance allocation
- shared reserve or backstop
- claim expiry and abandoned-fund sweep
- governance appeal or delayed execution

Do not add an adjacent policy only because the same funds or dispute already exist. Every additional beneficiary, funding source, deadline, role, or terminal path creates more state, accounting, authority, tests, and failure modes.

Mark deferred policies explicitly. A smaller honest alpha mechanism is safer than an implementation that silently settles unresolved insurance, bounty, and treasury questions.

## Separate The Economic Ledgers

Specify these ledgers independently before combining any of them:

| Ledger | Question | Required fields |
|---|---|---|
| Enforcement or penalty | What behavior is deterred and what exposure is forfeited? | Trigger, liable positions, formula, rounding, maximum penalty, destination |
| Restitution | Which harmed parties receive what recovery? | Claimant cohort, loss proof, cap, allocation, priority, shortfall |
| Reporter or keeper incentive | Which work needs compensation? | Eligible actor, proof of work, funding source, cap, replay rule |
| Surplus, reserve, or backstop | Who owns excess or covers a deficit? | Source, ownership, withdrawal rule, exhaustion behavior, governance |

For each ledger, record:

1. Funding source.
2. Beneficiary.
3. Priority relative to other ledgers.
4. Per-claim and global cap.
5. Rounding and dust ownership.
6. Funding timestamp.
7. Failure and retry behavior.
8. Whether governance may change an accrued claim.

Conservation must hold across the combined ledgers:

    total inflows = paid amounts + live liabilities + authorized residual

Do not use one balance field for amounts with different owners.

## Test Trigger And Penalty Proportionality

Build a matrix before approving slashing:

| Dimension | Record |
|---|---|
| Trigger cost | Bond, purchase, stake, proof, or governance threshold required |
| Trigger scope | One transaction, product, market, author, validator, or protocol |
| Harmed-party loss | Proven loss and maximum recoverable amount |
| Penalized exposure | Local and system-wide collateral reachable by the ruling |
| Maximum penalty | Worst-case amount under configured parameters |
| Beneficiaries | Harmed parties, reporter, keeper, treasury, reserve |
| Capturable excess | Amount a resolver, reporter, treasury, or coalition can redirect |

Threat-model at least:

- a low-cost trigger against large system-wide exposure
- collusion between resolver and any penalty beneficiary
- repeated triggers against the same exposure
- a penalty much larger than proven harm
- a penalty too small to deter profitable abuse
- rounding that kills a position while transferring little value
- a treasury or reserve windfall after claimant caps

A broad penalty may be an intentional reputational deterrent. Record that choice explicitly; do not let it emerge accidentally from a restitution formula.

## Control Report Admission

Define who has standing to trigger the mechanism and bind each report to one permanent incident identifier, such as a purchase, position, epoch, transaction, or signed claim. Specify:

- eligibility proof and the relationship between the reporter and alleged harm
- one-report, one-resolution, and replay behavior for the same incident
- bond, fee, rate limit, or other anti-spam cost and who receives it after each outcome
- filing window and the event that starts it
- cooldown or repeat-attempt rule after rejection, dismissal, expiry, or withdrawal
- aggregate limits when one actor can create many distinct but related reports

Do not rely on a bond alone when a cheap eligible action can reach broad collateral. Avoid report types that only write a negative reputation signal unless their protocol effect, abuse controls, correction path, and intended value are explicit.

## Define The Claim Model

Specify claimant identity and allocation rather than saying only “harmed parties first.”

| Model | Strength | Main risk |
|---|---|---|
| Single verified claimant | Small state and deterministic entitlement | Excludes other harmed parties |
| First-come shared pool | Simple aggregate reserve | Race allocation is not loss priority |
| Pro rata pool | Predictable equal treatment | Requires a closed cohort and denominator |
| Enumerated individual claims | Exact per-claim accounting | More storage, proofs, and lifecycle complexity |

For every model, decide:

- Which event or state proves eligibility?
- Which versions, epochs, markets, or time ranges are included?
- Is the entitlement fixed when funded or recalculated at claim time?
- Can total collateral leave a partial recovery?
- Is there a backstop, and who funds it?
- When does the claim deadline start?
- Who owns unclaimed funds after expiry?
- What happens if the recipient is blacklisted, reverts, or loses keys?
- How do upgrades and replacement deployments preserve existing claims?

Never start an expiry clock before the entitlement is fully funded and claimable.

## Keep A Complexity Ledger

Count the implementation obligations before design lock:

| Dimension | Count or description |
|---|---|
| Lifecycle states and terminal paths | Include dismissal, park, retry, finalize, expire, and recover |
| Persistent mappings and liabilities | Include replay guards and per-claim markers |
| Beneficiary classes and funding sources | One row per distinct owner of value |
| Privileged roles | Include resolver, treasury, pause, upgrade, and sweep authorities |
| Deadlines and time-dependent branches | Include start conditions and clock authority |
| External calls in state transitions | Include token transfers, hooks, oracles, and modules |
| Bounded pages or keeper calls | Include maximum work and completion proof |
| ABI and compatibility obligations | Include legacy views, events, and generated clients |
| Target-chain resource budgets | Include deploy size, compute or gas, transaction inputs, and storage |

Require each item to justify itself against the minimum mechanism. A feature that is individually reasonable can still make the combined state machine unreviewable or undeployable.

## Design Staged Settlement

Use staged settlement when exposure cannot be processed safely in one transaction:

1. **Record:** validate the trigger and permanently consume its replay identifier.
2. **Park:** record the ruling, snapshot mutable economics and total exposure, and freeze every mutation that can change the work set.
3. **Process:** execute bounded, permissionless, retry-safe pages with per-item replay guards.
4. **Finalize accounting:** prove completeness against the snapshot, create fixed liabilities, update terminal state, and release locks.
5. **Pay or claim:** process independently retryable transfers without reopening the ruling.

Required invariants:

- each trigger is consumed at most once
- each item contributes at most once
- the snapshotted work set cannot grow, shrink, or rotate while parked
- processed exposure never exceeds the snapshot
- finalization requires exact completion or another explicit proof
- configuration changes do not alter an already recorded ruling
- pause semantics preserve the approved terminal and claim paths
- a missing, duplicate, or malicious page cannot corrupt accounting

Permissionless does not guarantee liveness. Specify who monitors progress, who operates a fallback cranker, what event exposes the next work, and whether the incentive is sufficient.

## Protect Finalization And Liabilities

Avoid optional or recipient-dependent transfers inside a state transition that must release locks or make the protocol live again.

When recipient failure could block finalization:

- finalize checks and accounting first
- create a fixed, fully funded liability
- mark terminal state and release unrelated locks
- expose a separate pull or permissionless payout path
- mark paid before the external call and rely on atomic revert

This is not a universal requirement to use pull payments. An atomic push is acceptable when failure should revert the entire operation and cannot strand other users or protocol locks.

Treat every unpaid credit as a liability:

- exclude it from treasury, author, reward, and generic withdrawal balances
- include it in global solvency invariants
- expose outstanding-liability monitoring
- preserve its claim path across pause, upgrade, migration, or cutover
- define whether any recovery or sweep exists for permanently unreachable recipients

Raw contract balance is not proof of surplus.

## Budget The Target Chain

For a cross-chain port, fill this table before locking architecture:

| Constraint | Source chain | Target chain | Design response |
|---|---|---|---|
| Deployed code or program size |  |  |  |
| Per-transaction gas or compute |  |  |  |
| Transaction data and account inputs |  |  |  |
| Storage or account ownership |  |  |  |
| Cross-contract/program calls |  |  |  |
| Upgrade and verification topology |  |  |  |
| Existing ABI or client compatibility |  |  |  |

Preserve approved invariants and semantics, not implementation machinery. Validate a representative vertical slice with safety headroom before completing the full feature.

## Adversarial Test Matrix

Cover:

- malformed, unauthorized, stale, and replayed triggers
- ineligible reporters, duplicate incident identifiers, mass-report spam, and cooldown bypass
- configuration changes after trigger but before settlement
- work-set entry, exit, rotation, deletion, and duplication while parked
- empty, partial, duplicate, out-of-order, and final processing pages
- arithmetic floors, dust, caps, shortfall, and maximum values
- penalty below, equal to, and far above proven harm
- claimant exclusion, duplicate claim, late claim, and exhausted reserve
- reporter, resolver, keeper, and treasury collusion
- reverting, blacklisted, reentrant, and non-standard token recipients
- pause during every nonterminal and terminal state
- sequential disputes and global replay protection
- upgrade or cutover with live liabilities
- global conservation of assets, residuals, paid amounts, and unpaid claims

## Design-Lock Checklist

Before implementation:

- [ ] Core safety mechanism and non-goals are explicit.
- [ ] Four economic ledgers are specified separately.
- [ ] Trigger, harm, exposure, maximum penalty, payout, and capturable excess are compared.
- [ ] Report admission fixes standing, incident identity, replay, filing window, anti-spam cost, and repeat-attempt behavior.
- [ ] Claim cohort, allocation, funding, shortfall, deadline, and residual ownership are fixed.
- [ ] Every role, reserve, reward, timeout, sweep, and state is justified.
- [ ] Staged settlement has snapshot, freeze, replay, completeness, and liveness rules.
- [ ] Finalization cannot be stranded by an unrelated recipient failure.
- [ ] Live liabilities remain solvent and reachable through pause and cutover.
- [ ] Target-chain resource budgets are measured with safety headroom.
- [ ] Deviations from previously approved economics or compatibility are explicitly approved.
