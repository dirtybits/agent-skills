---
name: ethereum-development
description: Full-stack Ethereum development workflow for smart contracts, dApps, tooling, testing, security review, deployment, verification, and mainnet-ready operations across Foundry, Hardhat, Solidity, TypeScript, ethers, viem, wagmi, and common EVM networks.
---

# Ethereum Development

## When To Use

Use this skill when the task involves Ethereum or EVM development, including:

- Solidity smart contract design, implementation, refactoring, or review
- Foundry or Hardhat project setup, tests, scripts, forking, gas snapshots, or deployments
- dApp frontend integration with ethers, viem, wagmi, RainbowKit, WalletConnect, or EIP-1193 providers
- contract ABIs, generated clients, subgraphs, event indexing, bots, keepers, relayers, or backend services
- token standards, staking, governance, auctions, vaults, account abstraction, cross-chain messaging, or DeFi integrations
- security review, invariant testing, fuzzing, upgrade safety, access control, deployment runbooks, and verification

Do **not** treat a contract as production-ready because it compiles. Production readiness requires tests, adversarial review, deployment rehearsal, monitoring, and explicit risk acceptance.

## Core Principles

- **Start with state and invariants.** Define assets, actors, authorities, and invariant properties before writing Solidity.
- **Prefer simple, audited dependencies.** Use OpenZeppelin and well-known libraries when they fit; avoid custom crypto, proxy, math, or token logic without a reason.
- **Minimize trust and blast radius.** Every privileged role needs scope, delay, multisig ownership, revoke path, and monitoring.
- **Test behavior, not implementation trivia.** Cover normal flows, edge cases, adversarial users, reverts, events, accounting, permissions, upgrade paths, and fork integrations.
- **Never deploy from guesses.** Confirm chain ID, RPC, signer, nonce, constructor args, salts, proxy admin, verification inputs, and expected addresses before broadcasting.
- **Assume public mempools are adversarial.** Consider MEV, reordering, sandwiches, griefing, replay, frontrunning, and stale oracle data.

## Discovery Workflow

1. Identify the project stack:
   - Foundry: `foundry.toml`, `src/`, `test/`, `script/`, `forge`, `cast`, `anvil`
   - Hardhat: `hardhat.config.*`, `contracts/`, `test/`, `scripts/`, `typechain`
   - Frontend: `package.json`, `wagmi`, `viem`, `ethers`, `rainbowkit`, `connectkit`
   - Backend/indexer: `subgraph.yaml`, `ponder.config.*`, `substreams`, `Defender`, custom workers
2. Read project instructions, config, dependency versions, remappings, compiler settings, optimizer, EVM version, and network config.
3. Locate contracts, tests, deployment scripts, generated ABIs, addresses, and existing audit notes.
4. Determine target networks and whether the task is local-only, testnet, staging, mainnet, or multi-chain.
5. Check git status before editing and keep changes narrow.

## Design Workflow

Before implementation, write or infer:

1. **Goal:** one sentence describing the feature or protocol change.
2. **Actors:** users, admins, keepers, signers, relayers, bots, oracles, bridges, governance, attackers.
3. **Assets:** ETH, ERC-20, ERC-721, ERC-1155, LP shares, points, votes, claims, debt, receipts, wrapped assets.
4. **State:** contracts, storage variables, mappings, roles, ownership, proxy admin, external dependencies.
5. **Flows:** deposits, withdrawals, claims, swaps, mints, burns, transfers, upgrades, cancellations, emergencies.
6. **Invariants:** conservation of value, authorization, accounting, replay protection, monotonicity, solvency, supply caps, access bounds.
7. **Failure cases:** paused dependencies, stale oracle, zero liquidity, fee-on-transfer tokens, non-standard ERC-20s, reentrancy, chain reorg, failed callbacks.
8. **Upgrade/migration story:** storage layout, initializer, role transfer, rollback, data migration, user communication.

## Implementation Guidelines

### Solidity

- Use explicit Solidity version ranges consistent with the repo; avoid changing compiler versions unless required.
- Prefer custom errors over revert strings in new contracts unless the project convention differs.
- Emit events for externally meaningful state changes and index fields that off-chain systems query.
- Use Checks-Effects-Interactions, pull payments, reentrancy guards, and safe token transfer libraries where appropriate.
- Treat ETH transfers and ERC-20 transfers as untrusted external calls.
- Handle non-standard tokens: missing return values, fee-on-transfer, rebasing, blacklists, differing decimals, permit quirks.
- Avoid unbounded loops over user-controlled arrays in state-changing functions.
- Be explicit about rounding direction and who benefits from dust.
- Use `immutable` and `constant` when safe; do not optimize readability away prematurely.
- For signatures, include chain ID, verifying contract, nonce, deadline, domain separator, and typed data standard where appropriate.
- For CREATE2, verify salt derivation, init code hash, deployer, constructor args, and address collisions.

### Access Control

- Identify every privileged function and its role.
- Use least privilege: owner, admin, pauser, upgrader, keeper, fee setter, oracle setter, sweeper should not all be the same by default.
- Production admin should usually be a multisig/timelock, not an EOA.
- Dangerous changes need delay, bounds, events, and rollback/escape hatches.
- Test that unauthorized callers revert for every privileged path.

### Upgradeable Contracts

- Use OpenZeppelin upgradeable patterns if the project uses proxies.
- Never use constructors for upgradeable implementation initialization.
- Add initializer/reinitializer tests and ensure they cannot be called twice.
- Preserve storage layout and append new storage only at the end unless using namespaced storage deliberately.
- Verify proxy admin ownership, implementation address, initializer calldata, and upgrade authorization.
- Run storage layout checks before upgrades when tooling is available.

### Frontend And Client Integration

- Prefer typed ABIs and generated clients when the project already uses them.
- Keep contract addresses chain-specific and explicit; do not silently fall back to mainnet/testnet.
- Handle wallet disconnects, wrong chain, pending transactions, replaced transactions, reverts, and RPC errors.
- Use `bigint`/BigNumber consistently; never convert token amounts through floating point.
- Format units only at the UI boundary; keep internal calculations in base units.
- Simulate or estimate before sending when possible, but do not treat simulation success as finality.
- Surface transaction hash, explorer link, pending/confirmed/failed state, and retry guidance.

## Tooling Recipes

### Foundry

Common commands:

```bash
forge fmt
forge build
forge test
forge test -vvv --match-test <TestName>
forge test --match-contract <ContractName>
forge coverage
forge snapshot
forge inspect <ContractName> storage-layout
anvil
cast call <address> <signature> --rpc-url <rpc>
cast send <address> <signature> --rpc-url <rpc> --private-key <key>
```

Fork testing:

```bash
forge test --fork-url "$MAINNET_RPC_URL" --fork-block-number <block> -vvv
```

Deployment rehearsal:

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url "$RPC_URL" --sender <deployer> --dry-run -vvvv
forge script script/Deploy.s.sol:Deploy --rpc-url "$RPC_URL" --broadcast --verify -vvvv
```

### Hardhat

Common commands:

```bash
npm test
npx hardhat compile
npx hardhat test
npx hardhat test test/<file>.ts
npx hardhat node
npx hardhat run scripts/deploy.ts --network <network>
npx hardhat verify --network <network> <address> <constructor-args>
```

If the repo uses pnpm/yarn/bun, follow the repo's package manager and lockfile.

### Anvil Local Flow

1. Start Anvil in one terminal:
   ```bash
   anvil --chain-id 31337
   ```
2. Deploy to localhost.
3. Run frontend/backend against `http://127.0.0.1:8545`.
4. Use deterministic funded accounts only in local development.
5. Never reuse local default private keys on public networks.

## Testing Strategy

Minimum expected coverage for contract work:

- Compile/build passes.
- Unit tests for every public/external function touched.
- Revert tests for invalid input and unauthorized callers.
- Event emission tests for indexer-facing behavior.
- Edge cases: zero amounts, max amounts, duplicate calls, expired deadlines, changed price, depleted balances.
- Fuzz tests for arithmetic and user-controlled inputs.
- Invariant tests for conservation/accounting/authorization when the state machine has meaningful value flow.
- Fork tests for live protocol integrations, pinned to a block number.
- Gas snapshot if the project tracks gas.

Foundry examples:

```solidity
function test_RevertWhen_CallerNotOwner() public {
    vm.expectRevert();
    target.adminOnlyAction();
}

function invariant_TotalAssetsCoverShares() public view {
    assertGe(asset.balanceOf(address(vault)), vault.totalAssetsRequired());
}
```

Hardhat examples:

```ts
await expect(contract.connect(attacker).adminOnlyAction())
  .to.be.reverted;

await expect(contract.doThing(amount))
  .to.emit(contract, "ThingDone")
  .withArgs(user.address, amount);
```

## Security Review Checklist

Review these before considering the work complete:

### Authorization

- Can any user call privileged functions through direct calls, callbacks, delegatecalls, multicalls, or proxy paths?
- Are roles initialized correctly and transferred to production owners?
- Can an admin rug funds, alter claims, or bypass delays? If yes, is that disclosed and monitored?

### Accounting

- Are deposits, withdrawals, shares, fees, rewards, debt, and dust conserved?
- Does rounding favor the protocol or user intentionally and consistently?
- Can fee-on-transfer/rebasing tokens break accounting?
- Are decimals normalized and documented?

### External Calls

- Can reentrancy happen through ERC-777 hooks, ERC-721 receivers, fallback ETH receivers, token callbacks, or protocol callbacks?
- Are return values checked?
- Can a malicious token or external protocol grief by reverting?

### Oracles And Prices

- Are stale, zero, negative, paused, or manipulated prices rejected?
- Is the price source appropriate for the asset's liquidity and volatility?
- Are TWAP windows, heartbeat, decimals, and quote/base direction correct?

### MEV And Ordering

- Can users be sandwiched, frontrun, backrun, or griefed?
- Are slippage, deadlines, nonces, and commit-reveal mechanisms used where needed?
- Does liquidation/auction logic remain safe under reordering?

### Signatures And Replay

- Are signatures domain-separated by chain ID and contract?
- Are nonces consumed exactly once?
- Are deadlines enforced?
- Are EIP-712 types correct and stable?

### Upgrades

- Does storage layout remain compatible?
- Are initializers protected?
- Can implementation contracts be initialized or selfdestructed?
- Is upgrade authority held by the expected admin/timelock/multisig?

### Denial Of Service

- Are loops bounded?
- Can one bad user, token, oracle, receiver, or market block everyone?
- Are queues, withdrawals, disputes, and settlements resilient to partial failure?

## Deployment Runbook

Before broadcast:

1. Confirm branch, commit, clean git status, and release tag if applicable.
2. Confirm network name, chain ID, RPC URL, explorer URL, deployer address, deployer balance, nonce, gas settings.
3. Run full test suite and any fork/invariant tests required by the change.
4. Run deployment script in dry-run/simulation mode.
5. Record expected contract addresses, constructor args, initializer calldata, salt, owner/admin/roles.
6. Confirm private key or hardware wallet path without exposing secrets.
7. Confirm multisig/timelock addresses and role transfer order.
8. Prepare verification command and explorer API key.
9. Prepare rollback or pause plan.
10. Get explicit user approval before broadcasting to any public network.

After broadcast:

1. Save transaction hashes and deployed addresses.
2. Verify contracts on the explorer.
3. Check ownership, roles, proxy implementation, and initialized state.
4. Run read-only smoke tests against deployed contracts.
5. Update address books, frontend config, ABIs, docs, and monitoring.
6. Announce residual risks and required follow-ups.

## Output Format

For implementation tasks, report:

- Files changed
- Contracts/functions changed
- Security-sensitive assumptions
- Tests run with exact commands and results
- Deployment impact, if any
- Remaining risks or follow-ups

For review tasks, report findings by severity:

```markdown
## Critical
- [Issue]: impact, exploit path, affected code, fix

## High
...

## Medium
...

## Low / Informational
...

## Positive Notes
- What looks sound

## Verification
- Commands run / files reviewed
```

## Pitfalls

- Do not print private keys, mnemonics, RPC credentials, explorer API keys, or signed raw transactions.
- Do not broadcast transactions, change DNS, update production configs, or transfer ownership without explicit approval.
- Do not assume `transfer`/`send` are safe gas patterns for ETH; use deliberate call handling.
- Do not assume ERC-20s are standard.
- Do not assume testnet behavior or fork simulation guarantees mainnet execution.
- Do not ignore warnings from Slither, Foundry, Hardhat, TypeChain, or explorer verification.
- Do not modify generated files unless the repo expects generated artifacts to be committed.

## Verification Checklist

- [ ] Project stack, package manager, compiler settings, and network target identified.
- [ ] Contracts, tests, deployment scripts, and generated artifacts inspected before editing.
- [ ] Invariants and security-sensitive assumptions stated.
- [ ] Build/compile passes.
- [ ] Targeted tests pass.
- [ ] Broader tests, fuzz/invariant/fork tests, or explicit blockers reported.
- [ ] Deployment/verification steps are dry-run unless public broadcast was explicitly approved.
- [ ] Final response includes concrete command output and residual risk.
