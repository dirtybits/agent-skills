---
type: Reference
title: "Ethereum Development GUIDE"
description: "Reference material for the Ethereum Development skill."
resource: "https://github.com/dirtybits/agent-skills/blob/main/skills/ethereum-development/references/GUIDE.md"
tags: ["ethereum", "solidity", "evm", "smart-contracts", "foundry", "hardhat", "security", "dapp", "reference"]
timestamp: "2026-06-22T19:13:38Z"
okf_version: "0.1"
---
# Ethereum Development Guide

This reference expands the `ethereum-development` skill with practical checklists and command recipes.

## Environment Setup

### Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge --version
cast --version
anvil --version
```

Common project layout:

```text
foundry.toml
src/
test/
script/
lib/
```

### Hardhat

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
npx hardhat compile
npx hardhat test
```

### TypeScript Clients

Prefer viem for new TypeScript clients unless the repository already uses ethers.

```bash
npm install viem wagmi @tanstack/react-query
```

## Pre-Implementation Questions

- Which network and chain ID is targeted?
- Which assets can move, and who can custody them?
- Which contracts are upgradeable?
- Who owns the admin roles today and in production?
- Which addresses are trusted dependencies?
- What invariant would prove user funds are safe?
- Which off-chain services must consume events?
- What happens if an oracle, bridge, keeper, relayer, or RPC provider fails?

## Foundry Verification Commands

```bash
forge fmt --check
forge build --sizes
forge test -vvv
forge test --gas-report
forge snapshot
forge inspect <Contract> storage-layout
```

Fork test with pinned state:

```bash
forge test --fork-url "$MAINNET_RPC_URL" --fork-block-number <block> -vvv
```

Trace a transaction:

```bash
cast run --trace <tx_hash> --rpc-url "$RPC_URL"
```

Inspect storage:

```bash
cast storage <contract> <slot> --rpc-url "$RPC_URL"
```

## Hardhat Verification Commands

```bash
npx hardhat compile
npx hardhat test
npx hardhat test test/<file>.ts
npx hardhat coverage
npx hardhat run scripts/deploy.ts --network <network>
npx hardhat verify --network <network> <address> <constructor args...>
```

## Deployment Evidence To Capture

- Git commit
- Network and chain ID
- RPC provider used
- Deployer address
- Starting and ending nonce
- Deployed addresses
- Constructor args
- Initializer calldata
- Tx hashes and block numbers
- Verification URLs
- Role/owner checks
- Smoke test results

## Mainnet Readiness Gate

Do not recommend mainnet broadcast unless these are true or explicitly waived:

- Full tests pass.
- Fork tests pass for live dependencies.
- Invariants/fuzz tests cover value flows.
- Deployment dry-run succeeds.
- Verification inputs are prepared.
- Admin roles are production-safe.
- Monitoring and pause/rollback path exists.
- User explicitly approved the broadcast.
