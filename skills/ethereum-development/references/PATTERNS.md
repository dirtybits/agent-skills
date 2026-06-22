---
type: Reference
title: "Ethereum Development PATTERNS"
description: "Reference material for the Ethereum Development skill."
resource: "https://github.com/dirtybits/agent-skills/blob/main/skills/ethereum-development/references/PATTERNS.md"
tags: ["ethereum", "solidity", "evm", "smart-contracts", "foundry", "hardhat", "security", "dapp", "reference"]
timestamp: "2026-06-22T19:13:38Z"
okf_version: "0.1"
---
# Ethereum Development Patterns

## Pattern: Contract Change With Tests

1. Read the contract, tests, deployment scripts, and address config.
2. State the invariant or behavior being changed.
3. Add or update a failing test first when feasible.
4. Implement the smallest Solidity change.
5. Run formatter, build, targeted tests, then broader tests.
6. Report security assumptions and deployment impact.

## Pattern: Debug Revert

1. Reproduce with maximum verbosity.
2. Decode custom errors and panic codes.
3. Check caller, msg.value, allowances, balances, block state, chain ID, and proxy target.
4. Trace with Foundry/Hardhat/debug RPC.
5. Patch root cause, not the symptom.

Useful commands:

```bash
forge test -vvvv --match-test <TestName>
cast run --trace <tx_hash> --rpc-url "$RPC_URL"
cast 4byte <selector>
```

## Pattern: Gas Optimization

1. Measure baseline with `forge snapshot` or gas reporter.
2. Confirm correctness tests pass before optimizing.
3. Optimize one thing at a time.
4. Re-run tests and gas snapshot.
5. Keep readability unless savings are material.

Good candidates:

- storage packing
- caching storage reads
- calldata for read-only external params
- custom errors
- unchecked loop increments
- avoiding duplicate hashing/encoding

## Pattern: Upgrade Review

1. Identify proxy type and admin.
2. Compare old and new storage layout.
3. Check initializer/reinitializer behavior.
4. Simulate upgrade on fork.
5. Verify implementation address and post-upgrade state.
6. Confirm rollback/pause plan.

## Pattern: Frontend Transaction Flow

1. Check wallet connection and supported chain.
2. Read current contract state.
3. Simulate or estimate.
4. Send transaction with explicit account and chain.
5. Track pending, replaced, confirmed, and failed states.
6. Refresh indexed/on-chain state after confirmations.

## Anti-Patterns

- Broadcasting transactions from an agent without explicit approval.
- Printing private keys or signed raw transactions.
- Treating ERC-20 transfers as always standard.
- Relying on `transfer`/`send` gas behavior.
- Using floating point for token amounts.
- Ignoring proxy storage layout.
- Omitting events needed by indexers.
- Catching and swallowing failed keeper/relayer transactions.
