---
type: Skill
name: web3-protocol-design
title: "Web3 Protocol Design"
description: Designs and reviews web3 protocols, incentive systems, token flows, governance, payments, disputes, launch specs, and threat models. Use when planning or reviewing on-chain products, DeFi mechanisms, staking or slashing models, marketplaces, DAOs, bridges, or oracle-dependent systems.
resource: "https://github.com/dirtybits/agent-skills/tree/main/skills/web3-protocol-design"
tags: ["web3", "protocol-design", "tokenomics", "governance", "threat-modeling"]
timestamp: "2026-06-22T19:13:38Z"
okf_version: "0.1"
license: MIT
---

# Web3 Protocol Design

## When To Use

Use this skill when the task involves:

- designing a new web3 protocol or protocol feature
- reviewing tokenomics, fees, staking, rewards, slashing, or dispute flows
- specifying smart contract state, permissions, or account models
- choosing on-chain, off-chain, oracle, bridge, or keeper boundaries
- preparing a protocol spec, audit brief, test plan, or launch checklist

## Design Workflow

1. Define the protocol goal in one sentence, then list explicit non-goals.
2. Identify actors, assets, chains, contracts, off-chain services, and external dependencies.
3. Map the lifecycle as state transitions: initialization, normal use, settlement, recovery, upgrade, and shutdown.
4. Specify trust assumptions for admins, signers, sequencers, bridges, oracles, keepers, governance, and users.
5. Design incentives with concrete flows: who pays, who receives, when funds move, what can be slashed, and what can be extracted.
6. Write invariants before implementation details. Treat every invariant as a future test or monitor.
7. Threat-model the design against economic, technical, governance, liquidity, oracle, and UX failures.
8. Define launch gates: tests, simulations, audits, monitoring, limits, emergency controls, and rollout stages.

## Delivery And Activation Stages

Track design lock, implementation, merge, deployability, deployment and verification, client/operator configuration, feature activation, live smoke, and public launch approval as separate states. Do not use “complete,” “deployed,” or “live” interchangeably.

- For a gated mechanism, specify the disabled/default state, enabling authority, dependent contracts and clients, operational inputs, monitoring, rollback, and evidence required to advance each state.
- Treat user entry points, claim or exit paths, operator runbooks, custody and role assignments, address/config distribution, and live-flow verification as activation deliverables rather than incidental follow-up work.
- Revalidate the candidate after prerequisite merges or deployment changes. Prior checks against an older head, base, address, or compiler artifact do not certify the resulting release.
- On a non-production network with no live liabilities, prefer an explicitly approved clean break when it removes migration and compatibility machinery. Record the state, clients, addresses, and fixtures that the break invalidates.

## Staged Trust And Governance

Allow centralized adjudication or operations in an early stage only as an explicit trust boundary, not implied decentralization. Bound the authority, outcomes, economic discretion, evidence and event trail, monitoring, pause or rollback path, and transition criteria. Do not add governance, appeals, or incentives merely to make an alpha appear decentralized.

## Complex Settlement Guardrails

Read [Slashing And Dispute Settlement](references/slashing-and-dispute-settlement.md) when a mechanism combines penalties, claims, rewards, reserves, deadlines, sweeps, or multi-transaction settlement.

- Decompose enforcement, restitution, reporter or keeper incentives, and surplus routing into separate ledgers. For each, specify funding source, beneficiary, priority, cap, and failure behavior before combining them.
- Compare trigger cost and scope, harmed-party loss, penalized exposure, and beneficiary payout. Require an explicit cap or risk acceptance for cheap-trigger/system-wide-penalty and windfall cases.
- Define claimant cohort, allocation rule, funding point, shortfall behavior, deadline start, unclaimed-fund ownership, and upgrade or cutover treatment.
- Require every role, reserve, reward, timeout, sweep, and lifecycle state to justify itself against the minimum credible safety mechanism. Defer adjacent insurance, bounty, governance, or redistribution policy when unnecessary.
- For staged work, snapshot mutable economics and exposure, freeze every mutation that can change the work set, make replay boundaries permanent, and prove completion through conserved accounting.
- Do not make terminal state or lock release depend on a recipient transfer. Finalize fixed accounting first, then use independently retryable payouts when recipient failure could block the protocol.
- Treat unpaid credits and no-expiry claims as liabilities. Raw contract balance is not surplus while any liability remains, and successor deployments must preserve old claims.
- For cross-chain ports, preserve approved invariants and semantics rather than source-chain machinery. Budget target-chain code/program size, gas/compute, transaction inputs, state ownership, call boundaries, and upgrade topology before design lock.

## Protocol Spec Template

Use this structure unless the user asks for another format:

```markdown
# Protocol Spec: [Name]

## Goal
[One sentence.]

## Non-Goals
- [Non-goal.]

## Actors
- [Actor]: [permissions, incentives, risks.]

## Assets And Units
- [Asset]: [decimals, custody location, transfer constraints.]

## State Model
- [State/account/contract]: [owner, fields, authority, lifecycle.]

## Chain Resource Budget
- Deployment code/program size:
- Per-transaction gas/compute:
- Transaction data/accounts:
- State ownership and call boundaries:

## Flows
1. [Flow name]: [preconditions, steps, postconditions, failure cases.]

## Incentives
- Fees:
- Rewards:
- Penalties:
- Slashing:
- Claim cohort and allocation:
- Funding priority, shortfall, and backstop:
- Surplus and unclaimed-fund ownership:
- Trigger, harm, maximum penalty, and maximum payout:
- MEV/extraction risk:

## Trust Assumptions
- Admin:
- Adjudicator or resolver:
- Oracle:
- Bridge:
- Keeper:
- Governance:

## Invariants
- [Invariant that must always hold.]

## Threat Model
- [Threat]: [impact, likelihood, mitigation, residual risk.]

## Test Plan
- Unit:
- Integration:
- Simulation:
- Adversarial:

## Launch Checklist
- Implementation and merge gate:
- Deployment and verification gate:
- Client and operator activation gate:
- Live-smoke and public-launch gate:
```

## Review Checklist

Check these before calling a design ready:

- The protocol has a clear asset custody model and no ambiguous owner of funds.
- Every privileged action has an authority, delay, scope limit, and monitoring plan.
- Fees, rewards, and slashing are denominated in exact units and rounding behavior is specified.
- Design-locked economics and safety bounds are distinguished from intentionally configurable parameters and enforced by deployment and initialization checks.
- Oracle, bridge, and keeper failures have explicit stale-data and liveness behavior.
- User deposits, withdrawals, refunds, disputes, and cancellations have bounded failure paths.
- Report or dispute admission has explicit standing, replay identity, filing window, anti-spam cost, and repeat-attempt behavior.
- Enforcement, restitution, incentives, and surplus are separately specified before their ledgers are combined.
- Maximum penalty and payout are compared with trigger cost, harmed-party loss, and penalized exposure.
- Claim funding, shortfall, expiry, sweep, transfer failure, and upgrade/cutover behavior are explicit.
- Incentives still work when volume is low, rewards are exhausted, liquidity is thin, or a rational actor griefs the system.
- Upgrade and emergency controls cannot silently change user claims without a visible process.
- Implementation, deployment, activation, and public launch status are evidenced separately.
- Invariants are testable and include conservation of value, authorization, accounting, and replay protection.

## Output Guidance

- Lead with the recommendation or design decision.
- Separate facts, assumptions, open questions, and risks.
- Prefer concrete numbers and state transitions over broad claims.
- Mark unfinished mechanisms as `WIP` and list the missing proof, test, or decision.
- When reviewing an existing design, prioritize correctness risks before improvements.
