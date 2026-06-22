---
name: ethereum-development
description: Production-grade Ethereum/EVM development workflow for smart contracts, dApps, transactions, clients, gas optimization, testing, security review, deployment, verification, monitoring, and incident response across Foundry, Hardhat, Solidity, TypeScript, viem, ethers, wagmi, and common EVM networks.
version: "2.0.0"
license: MIT
sasmp_version: "1.3.0"
updated: "2026-06"
atomic: true
single_responsibility: ethereum_development
parameters:
  topic:
    type: string
    required: false
    enum: [architecture, solidity, evm, gas, transactions, clients, testing, security, deployment, frontend, indexing, debugging, incident-response]
  network:
    type: string
    required: false
    default: local
    enum: [local, mainnet, sepolia, holesky, hoodi, base, optimism, arbitrum, polygon, bsc, avalanche, gnosis, custom]
  stack:
    type: string
    required: false
    enum: [foundry, hardhat, mixed, frontend, backend, indexer, unknown]
retry_config:
  max_attempts: 3
  backoff: exponential
  initial_delay_ms: 1000
metadata:
  tags: [ethereum, evm, solidity, smart-contracts, foundry, hardhat, viem, ethers, wagmi, security, gas, deployment]
  related_skills: [web3-protocol-design]
---

# Ethereum Development

## Purpose

Use this skill to build, review, debug, test, deploy, and operate Ethereum and EVM systems. It covers the full path from protocol design to Solidity implementation, frontend/client integration, transaction mechanics, gas optimization, security hardening, deployment verification, and post-deploy monitoring.

The operating standard is: **no contract or integration is production-ready merely because it compiles or a happy-path test passes.** Production readiness requires invariants, adversarial tests, deployment rehearsal, verification, monitoring, and explicit risk acceptance.

## When To Use

Use this skill when the task involves:

- Solidity smart contract design, implementation, refactoring, or review
- Foundry or Hardhat project setup, tests, scripts, fork testing, fuzzing, invariant testing, gas snapshots, or deployments
- dApp integration with viem, ethers, wagmi, RainbowKit, ConnectKit, WalletConnect, or EIP-1193 providers
- Ethereum RPC, traces, storage slots, logs, receipts, fee estimation, nonce management, mempool behavior, or transaction debugging
- Token standards: ERC-20, ERC-721, ERC-1155, ERC-4626, ERC-2612, ERC-2981, ERC-4337/account abstraction
- Protocol features: staking, vesting, vaults, swaps, auctions, governance, payments, allowlists, claims, cross-chain messaging, oracle-dependent flows
- Indexers, bots, keepers, relayers, Defender automation, subgraphs, Ponder, or backend services consuming contract events
- Security review, gas optimization, upgrade safety, deployment runbooks, mainnet readiness, and incident response

Do not use this skill as a substitute for protocol design. If incentives, custody, governance, or tokenomics are still unclear, pair it with `web3-protocol-design` first.

## Core Principles

1. **Start with state, actors, and invariants.** Define who can do what, which assets move, and what must always hold before editing contracts.
2. **Prefer boring audited dependencies.** Use OpenZeppelin and proven libraries when they fit; avoid custom crypto, proxy, token, permit, and math code without a reason.
3. **Minimize authority and blast radius.** Every privileged function needs a scoped role, bounds, event emission, production owner, delay or multisig path, and monitoring.
4. **Treat all external calls as adversarial.** ETH receivers, token contracts, oracle adapters, AMMs, bridges, hooks, callbacks, and proxies can revert, reenter, grief, or behave non-standardly.
5. **Keep value math in base units.** Never use floating point for token amounts. Be explicit about decimals and rounding direction.
6. **Test behavior and invariants, not implementation trivia.** Cover normal flows, edge cases, reverts, authorization, events, accounting, fuzz properties, invariants, and fork integrations.
7. **Assume public mempools are hostile.** Consider MEV, frontrunning, backrunning, sandwiching, nonce replacement, replay, reorgs, stale state, and gas griefing.
8. **Never broadcast from guesses.** Confirm chain ID, RPC, signer, nonce, gas, constructor args, initializer data, salts, proxy admin, verification inputs, and expected addresses before deploying.

## Discovery Workflow

Before making changes:

1. Check git status and read project instructions.
2. Identify the stack:
   - Foundry: `foundry.toml`, `src/`, `test/`, `script/`, `forge`, `cast`, `anvil`
   - Hardhat: `hardhat.config.*`, `contracts/`, `test/`, `scripts/`, TypeChain
   - Frontend: `package.json`, wagmi, viem, ethers, RainbowKit, ConnectKit
   - Indexer/backend: `subgraph.yaml`, `ponder.config.*`, event consumers, relayers, keeper scripts
3. Inspect compiler settings: Solidity version, optimizer runs, EVM version, viaIR, remappings, libraries, and dependency versions.
4. Locate address books, deployment artifacts, ABIs, generated clients, verification data, and prior audit notes.
5. Determine the target network and environment: local, fork, testnet, staging, mainnet, or multi-chain.
6. Identify all externally owned accounts, multisigs, timelocks, keepers, relayers, oracle feeds, bridges, and protocol dependencies.

## Design And Implementation Workflow

1. Write or infer a one-sentence goal and explicit non-goals.
2. List actors, assets, contract state, off-chain services, and external dependencies.
3. Define lifecycle flows: initialize, deposit, withdraw, transfer, claim, settle, upgrade, pause, recover, shutdown.
4. Write invariants first. Examples:
   - total shares never exceed claimable assets beyond intentional debt
   - only authorized roles can change parameters
   - a signature/nonce can be used at most once
   - user funds cannot be trapped by another user's revert
   - supply caps and per-user limits are always enforced
5. Implement the smallest change consistent with existing project conventions.
6. Add or update tests before declaring success.
7. Run formatters, compile, targeted tests, and broader tests appropriate to risk.
8. For public network actions, prepare a runbook and get explicit approval before broadcasting.

## Solidity Guidance

### State And Storage

- Pack storage deliberately when it does not obscure correctness.
- Avoid unbounded iteration over user-controlled arrays in state-changing functions.
- Be explicit about upgradeable storage layout. Append storage only unless namespaced storage is intentionally used.
- Use `constant` and `immutable` where safe, but do not trade away upgrade requirements.
- Know storage slot mechanics for mappings and dynamic arrays when debugging:
  - mapping value slot: `keccak256(abi.encode(key, mappingSlot))`
  - dynamic array data starts at `keccak256(arraySlot)`

### Function Design

- Validate inputs early; order cheap checks before expensive reads/calls.
- Use custom errors in new Solidity code unless project conventions differ.
- Emit events for externally meaningful state changes; index fields used by indexers.
- Follow checks-effects-interactions and consider pull-payment patterns.
- Treat ERC-20/721/1155 calls as external calls with arbitrary behavior.
- Do not rely on `transfer`/`send` gas assumptions for ETH.
- Avoid hidden dependencies on `block.timestamp` or `block.number` precision.

### Tokens

Handle non-standard token behavior:

- no return value, false return value, revert-on-zero, revert-on-nonzero-to-nonzero allowance
- fee-on-transfer, rebasing, blacklists, pausable transfers, ERC-777 hooks
- unusual decimals, changing decimals, proxy tokens, permit variants
- ERC-4626 share/asset rounding and inflation attacks

### Signatures

- Prefer EIP-712 typed data for structured signatures.
- Domain-separate by name, version, chain ID, and verifying contract.
- Include nonce, deadline, signer, target contract, value/amount, and chain-specific context.
- Consume nonces exactly once and test replay failure.
- Consider EIP-1271 smart contract signatures when supporting smart wallets.

### Upgradeable Contracts

- Use OpenZeppelin upgradeable patterns when possible.
- Never initialize upgradeable state in constructors.
- Disable initializers on implementation contracts where appropriate.
- Test initializer and reinitializer paths cannot be called twice.
- Verify proxy admin, implementation, upgrade authority, storage layout, and initializer calldata.
- Run storage layout tooling before upgrades.

## EVM And Transaction Mechanics

### EVM Basics To Remember

- Stack machine with 256-bit words and max stack depth of 1024.
- Memory is transient, byte-addressed, and has expansion costs.
- Storage is persistent 32-byte slots and usually dominates gas costs.
- `CALL`, `DELEGATECALL`, `STATICCALL`, `CREATE`, `CREATE2`, logs, and SSTORE have security and gas implications.
- `delegatecall` executes callee code in caller storage context. Treat it as highly privileged.

### Transaction Types

- Type 0 legacy: `gasPrice`
- Type 1 access list: EIP-2930
- Type 2 EIP-1559: `maxFeePerGas`, `maxPriorityFeePerGas`
- Blob transactions on applicable networks: EIP-4844 semantics for blob gas

Operational checks:

- Confirm nonce with pending state when replacing or submitting multiple txs.
- Set `maxFeePerGas` high enough to survive base fee movement; tip should reflect urgency.
- For replacement, increase fee enough for the client/network replacement rule.
- Inspect receipts for `status`, logs, gas used, effective gas price, and contract address.

### Common Transaction Errors

- `nonce too low`: local nonce behind or tx already mined/replaced. Check pending nonce.
- `replacement transaction underpriced`: replacement fee bump too small.
- `intrinsic gas too low`: calldata/access list/value transfer base cost issue.
- `execution reverted`: simulate/trace and decode custom error.
- `out of gas`: estimate plus trace; distinguish actual gas shortage from infinite/reverting path.
- `insufficient funds`: include value + gas limit * max fee, not only transfer amount.

## Tooling Recipes

### Foundry

```bash
forge fmt
forge build
forge build --sizes
forge test
forge test -vvv --match-test <TestName>
forge test --match-contract <ContractName>
forge test --gas-report
forge coverage
forge snapshot
forge inspect <ContractName> storage-layout
anvil --chain-id 31337
cast call <address> "fn()" --rpc-url "$RPC_URL"
cast send <address> "fn(uint256)" 1 --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY"
cast storage <address> <slot> --rpc-url "$RPC_URL"
cast run --trace <tx_hash> --rpc-url "$RPC_URL"
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

```bash
npm test
npx hardhat compile
npx hardhat test
npx hardhat test test/<file>.ts
npx hardhat node
npx hardhat run scripts/deploy.ts --network <network>
npx hardhat verify --network <network> <address> <constructor-args>
```

Follow the repo's package manager and lockfile: npm, pnpm, yarn, or bun.

### viem Client Examples

Read storage slot for `mapping(address => uint256) balances` at slot 0:

```ts
import { createPublicClient, encodePacked, http, keccak256 } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({ chain: mainnet, transport: http() });

export async function getRawBalanceSlot(contract: `0x${string}`, user: `0x${string}`) {
  const slot = keccak256(encodePacked(["address", "uint256"], [user, 0n]));
  return client.getStorageAt({ address: contract, slot });
}
```

Send an EIP-1559 transaction:

```ts
import { createWalletClient, http, parseEther, parseGwei } from "viem";

const wallet = createWalletClient({ transport: http() });

const hash = await wallet.sendTransaction({
  account,
  to: recipient,
  value: parseEther("0.1"),
  maxFeePerGas: parseGwei("30"),
  maxPriorityFeePerGas: parseGwei("2"),
});
```

## Gas Optimization Checklist

Optimize only after correctness is established and measured.

| Technique | Typical Benefit | Caution |
|---|---:|---|
| Storage packing | high | Can reduce readability; verify layout for upgrades |
| Cache storage reads | medium/high | Do not cache stale values across external calls |
| Use calldata for read-only external params | low/medium | Not for values that must be mutated |
| Custom errors | low/medium | Keep errors descriptive enough for debugging |
| Unchecked increments | low | Only where overflow is impossible by construction |
| Short-circuit cheap checks first | variable | Preserve intended revert precedence if tested |
| Avoid repeated hashing/encoding | variable | Do not precompute with wrong domain/context |
| Batch operations | variable | Beware block gas limit and DoS loops |

Gas test template:

```solidity
function test_GasBudget() public {
    uint256 beforeGas = gasleft();
    target.optimizedFunction();
    uint256 used = beforeGas - gasleft();
    assertLt(used, 50_000, "gas budget exceeded");
}
```

## Testing Strategy

Minimum expected verification for contract changes:

- Build/compile passes.
- Unit tests for every touched public/external behavior.
- Revert tests for invalid inputs, unauthorized callers, and unsafe states.
- Event tests for indexer-facing behavior.
- Edge cases: zero amounts, max amounts, duplicate calls, expired deadlines, changed price, depleted balances, dust, paused state.
- Fuzz tests for arithmetic and user-controlled inputs.
- Invariant tests for value/accounting/authorization state machines.
- Fork tests for live integrations pinned to a block number.
- Gas snapshot/report if gas matters.

Foundry invariant example:

```solidity
function invariant_TotalAssetsCoverShares() public view {
    assertGe(asset.balanceOf(address(vault)), vault.totalAssetsRequired());
}
```

Hardhat examples:

```ts
await expect(contract.connect(attacker).adminOnlyAction()).to.be.reverted;
await expect(contract.doThing(amount))
  .to.emit(contract, "ThingDone")
  .withArgs(user.address, amount);
```

## Security Review Checklist

### Authorization

- Can unauthorized users reach privileged behavior through direct calls, callbacks, delegatecalls, multicalls, proxies, or initialization paths?
- Are roles initialized correctly and transferred to production owners?
- Can admins rug, freeze, alter claims, sweep assets, or bypass delays? If yes, is it intended, bounded, documented, and monitored?

### Accounting

- Are deposits, withdrawals, shares, rewards, fees, debt, and dust conserved?
- Is rounding direction intentional and tested?
- Do fee-on-transfer, rebasing, and non-standard decimals break accounting?
- Are ERC-4626 inflation/donation attacks considered where relevant?

### External Calls And Reentrancy

- Can reentrancy occur through token hooks, receiver callbacks, fallback ETH receivers, protocol callbacks, or multicall?
- Are external return values checked?
- Can a malicious token or external protocol block everyone by reverting?

### Oracles And Prices

- Reject stale, zero, negative, paused, incomplete, or incorrectly-decimaled prices.
- Confirm heartbeat, deviation threshold, base/quote direction, sequencer uptime feeds on L2s, and fallback behavior.
- Consider manipulation cost for TWAPs and low-liquidity pools.

### MEV And Ordering

- Are slippage limits, deadlines, nonces, and recipient checks present?
- Can auctions, liquidations, claims, or swaps be sandwiched, frontrun, griefed, or backrun?
- Is commit-reveal or private orderflow needed?

### Upgrades

- Storage layout compatible?
- Initializers protected?
- Implementation cannot be initialized or abused?
- Upgrade authority held by expected timelock/multisig?
- Rollback or pause plan exists?

### Denial Of Service

- Are loops bounded?
- Can one user's revert block batch processing?
- Can queues, withdrawals, disputes, claims, or settlements handle partial failure?

## Frontend And Client Integration

- Keep address maps chain-specific and explicit; never silently fall back to mainnet/testnet.
- Use typed ABIs or generated clients when available.
- Keep internal token math in `bigint`/BigNumber base units; format only at UI boundaries.
- Handle wallet disconnect, wrong chain, unsupported chain, pending tx, replaced tx, revert, RPC outage, and indexer lag.
- Simulate or estimate before sending where possible, but treat simulation as advisory, not finality.
- Surface tx hash, explorer link, pending/confirmed/failed state, and retry guidance.
- For reads, consider block tags and stale cache behavior.

## Indexing, Bots, And Backends

- Treat events as an API: stable names, indexed fields, enough data for consumers.
- Handle reorgs by waiting confirmations and supporting rollback/replay.
- Store cursor/checkpoint state transactionally.
- Make relayers and keepers idempotent. A duplicate execution attempt should not corrupt state.
- Rate-limit RPC calls and use backoff for 429/5xx responses.
- Monitor missed events, stuck nonces, reverted keeper txs, and divergence between indexer state and on-chain state.

## Deployment Runbook

Before public broadcast:

1. Confirm clean git status, branch, commit, release tag, and artifacts.
2. Confirm network name, chain ID, RPC URL, explorer URL, deployer address, deployer balance, nonce, and gas settings.
3. Run full test suite and required fork/fuzz/invariant tests.
4. Run deployment script in dry-run/simulation mode.
5. Record expected addresses, constructor args, initializer calldata, CREATE2 salts, proxy admin, implementation, owner, roles.
6. Confirm secrets path or hardware wallet flow without exposing keys.
7. Confirm multisig/timelock addresses and role transfer order.
8. Prepare verification command and explorer API key.
9. Prepare pause/rollback/communication plan.
10. Get explicit user approval before broadcasting.

After broadcast:

1. Save tx hashes, deployed addresses, block numbers, and verification links.
2. Verify contracts on explorer.
3. Check roles, ownership, proxy implementation, initialized state, parameters, and balances.
4. Run read-only smoke tests against deployed contracts.
5. Update address books, ABIs, generated clients, docs, frontend config, bots, and monitoring.
6. Report residual risk and required follow-ups.

## Debugging Playbooks

### Revert Without Clear Error

1. Re-run with verbose traces: `forge test -vvvv` or `cast run --trace`.
2. Decode custom error selectors against compiled ABIs.
3. Check caller, msg.value, approvals, balances, block timestamp, chain ID, and fork block.
4. Confirm proxy address vs implementation address.

### Nonce Or Pending Tx Problems

1. Compare latest and pending nonce.
2. Check mempool/pending transactions from the deployer.
3. Replace with higher fee if safe, or wait for inclusion.
4. Do not submit a new deployment sequence until nonce state is understood.

### Explorer Verification Fails

1. Confirm exact compiler version, optimizer, runs, EVM version, viaIR, libraries, constructor args.
2. Verify implementation and proxy separately where applicable.
3. Compare deployed bytecode and locally compiled bytecode.
4. Check flattened vs standard JSON verification expectations.

## Output Format

For implementation tasks:

```markdown
## Summary
- What changed

## Files Changed
- path: purpose

## Security-Sensitive Assumptions
- assumption / risk

## Verification
- command -> result

## Deployment Impact
- none / local only / testnet / mainnet-affecting

## Remaining Risks
- risk or follow-up
```

For review tasks, use severity buckets:

```markdown
## Critical
- issue, impact, exploit path, affected code, recommended fix

## High
...

## Medium
...

## Low / Informational
...

## Positive Notes
- what looks sound

## Verification
- files reviewed and commands run
```

## Pitfalls

- Do not print private keys, mnemonics, RPC credentials, explorer API keys, bearer tokens, or signed raw transactions.
- Do not broadcast public-network transactions, change production configs, verify production contracts, or transfer ownership without explicit approval.
- Do not assume ERC-20s are standard.
- Do not assume fork simulation guarantees public-chain success.
- Do not ignore warnings from Solidity, Slither, Foundry, Hardhat, TypeChain, or explorer verification.
- Do not commit generated artifacts unless the repo convention requires them.
- Do not hide admin trust assumptions; call them out plainly.

## Verification Checklist

- [ ] Stack, package manager, compiler settings, and network target identified.
- [ ] Contracts, tests, deployment scripts, generated artifacts, and address books inspected before editing.
- [ ] Actors, assets, authorities, and invariants stated for non-trivial changes.
- [ ] Build/compile passes.
- [ ] Targeted tests pass.
- [ ] Broader tests, fuzz/invariant/fork tests, gas checks, or explicit blockers reported.
- [ ] Deployment steps remain dry-run unless public broadcast was explicitly approved.
- [ ] Final response includes concrete command output, changed files, deployment impact, and residual risks.
