---
type: Skill
name: ethereum-development
title: "Ethereum Development"
description: Production-grade Ethereum/EVM development workflow for smart contracts, dApps, transactions, clients, gas optimization, testing, security review, deployment, verification, monitoring, and incident response across Foundry, Hardhat, Solidity, TypeScript, viem, ethers, wagmi, and common EVM networks.
resource: "https://github.com/dirtybits/agent-skills/tree/main/skills/ethereum-development"
tags: ["ethereum", "solidity", "evm", "smart-contracts", "foundry", "hardhat", "security", "dapp", "viem", "ethers", "wagmi", "gas", "deployment"]
timestamp: "2026-06-22T19:13:38Z"
okf_version: "0.1"
version: "2.3.0"
license: MIT
updated: "2026-07"
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
7. Record each growing contract's deployed-runtime baseline, target-chain hard limit, and project soft limit under the exact production compiler profile.

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

## Release State And Feature Gates

Track these as separate claims: implemented and tested, merged on the current base, deployable under the production compiler profile, deployed and bytecode-verified, configured, activated, and live-smoked or operationally approved. Evidence for one state does not imply the next.

- For gated features, record the default state, enabling authority, contract and client dependencies, activation transaction or configuration change, monitoring, and rollback path. A feature may be implementation-complete while deployment and activation remain blocked.
- For stacked or interacting changes, define the merge and deployment dependency order. After each prerequisite merge, update the remaining candidates onto the new base and rerun affected size, ABI, storage-layout, deployment-script, and integration gates; green checks from an earlier head or base do not certify the merge result.

## Runtime Size And Architecture

Treat deployed runtime bytecode as a deployability invariant, not a gas optimization. Read [Contract Size And Architecture](references/CONTRACT_SIZE.md) when a contract is expected to grow materially or approaches its target-chain limit.

- Measure deployed runtime before substantial work and after each representative vertical slice; record baseline, delta, hard limit, and remaining headroom under the exact production compiler profile.
- Set a project soft limit below the chain's hard limit when review fixes or future growth are expected. A green test suite never overrides an undeployable artifact.
- Attribute actual byte growth before optimizing. Prefer mechanism simplification, measured deduplication, and compact ABI surfaces before adding cross-contract or upgrade complexity.
- Treat linked libraries, compiler-pipeline changes, modules, facets, and proxies as architecture or deployment changes. Compare storage, ABI, verification, security, upgradeability, and regression impact explicitly.

## Solidity Guidance

### State And Storage

- Pack storage deliberately when it does not obscure correctness.
- Avoid unbounded iteration over user-controlled arrays in state-changing functions.
- Be explicit about upgradeable storage layout. Append storage only unless namespaced storage is intentionally used.
- Use `constant` and `immutable` where safe, but do not trade away upgrade requirements.
- Know storage slot mechanics for mappings and dynamic arrays when debugging:
  - mapping value slot: `keccak256(abi.encode(key, mappingSlot))`
  - dynamic array data starts at `keccak256(arraySlot)`
- Transient storage (EIP-1153 `tstore`/`tload`) clears at the end of the transaction. It fits reentrancy locks and intra-transaction context, never persistent state; confirm target-chain support before relying on it.

### Function Design

- Validate inputs early; order cheap checks before expensive reads/calls.
- Use custom errors in new Solidity code unless project conventions differ.
- Emit events for externally meaningful state changes; index fields used by indexers.
- Follow checks-effects-interactions and consider pull-payment patterns.
- Treat ERC-20/721/1155 calls as external calls with arbitrary behavior.
- Do not rely on `transfer`/`send` gas assumptions for ETH.
- Avoid hidden dependencies on `block.timestamp` or `block.number` precision.
- Budget view functions and getters: large tuples, nested structs, dynamic values, and compatibility wrappers can generate substantial runtime ABI-encoder code.

### Tokens

Handle non-standard token behavior:

- no return value, false return value, revert-on-zero, revert-on-nonzero-to-nonzero allowance
- fee-on-transfer, rebasing, blacklists, pausable transfers, ERC-777 hooks
- unusual decimals, changing decimals, proxy tokens, permit variants
- ERC-4626 share/asset rounding and inflation attacks

### Signatures

- Prefer EIP-712 typed data for structured signatures.
- Domain-separate by name, version, chain ID, and verifying contract.
- Bind each signature to one explicit action or purpose and every security-relevant object or payload field: method or selector, resource ID, recipient, amount, and request hash as applicable. Never reuse a generic proof-of-wallet signature across mutations.
- Include a nonce and deadline. A timestamp or deadline only narrows the replay window; it does not prevent same-action replay. Consume the nonce atomically and exactly once, or use an equivalent replay ledger.
- Test cross-purpose, cross-object, modified-payload, duplicate, expired, cross-chain, and cross-contract attempts.
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
- Type 3 blob transactions on applicable networks: EIP-4844 semantics for blob gas
- Type 4 set-code: EIP-7702 delegates an EOA to contract code via a signed authorization list. Check chain support, delegation revocation, and that contracts no longer assume `msg.sender == tx.origin` implies a plain EOA.

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

Full command recipes live in [references/GUIDE.md](references/GUIDE.md): Foundry build/test/trace/storage commands, fork testing, deployment rehearsal, Hardhat equivalents, and viem client examples (storage slot reads, EIP-1559 sends). Follow the repo's package manager and lockfile: npm, pnpm, yarn, or bun.

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
- Deployed-runtime measurement and soft/hard size-budget enforcement if a contract changed.

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

### Review Provenance

- Record the reviewed commit SHA and compiler or deployment artifact. Before accepting or dismissing an automated or human finding, reproduce the claimed behavior on the current head; an old line location or old-head behavior is not evidence about the current artifact.
- After a fix, add regression coverage and rerun the relevant review against the new head. Resolve stale findings with current-code and test evidence rather than silently ignoring them.

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
- Where reads can originate from multiple deployments, namespace cache keys, query keys, indexed state, and deduplication keys by chain ID and deployed contract address before entity-specific fields. Do not key deployment-specific state by user or entity alone.
- Invalidate or refetch on contract-address, proxy-implementation, ABI/version, or network changes. Test that identical entity identifiers queried through two contracts on the same chain remain independent.
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
3. Separate true deployment inputs from design-locked protocol constants. Do not expose approved economics or safety bounds as accidental environment knobs; enforce them in the deployment path and initializer or constructor.
4. Run full test suite and required fork/fuzz/invariant tests.
5. Confirm deployed runtime is within the recorded hard and soft limits under the exact verification compiler profile.
6. Run deployment script in dry-run/simulation mode.
7. Record expected addresses, linked-library map and code hashes when applicable, constructor args, initializer calldata, CREATE2 salts, proxy admin, implementation, owner, and roles.
8. Confirm secrets path or hardware wallet flow without exposing keys.
9. Confirm multisig/timelock addresses and role transfer order.
10. Prepare verification command and explorer API key.
11. Prepare pause/rollback/communication plan.
12. Get explicit user approval before broadcasting.

After broadcast:

1. Save tx hashes, deployed addresses, block numbers, and verification links.
2. Verify contracts on explorer.
3. Check roles, ownership, proxy implementation, initialized state, parameters, and balances.
4. Run read-only smoke tests against deployed contracts.
5. Update address books, ABIs, generated clients, docs, frontend config, bots, and monitoring.
6. Report residual risk and required follow-ups.

## Debugging Playbooks

### Revert Without Clear Error

1. Re-run with verbose traces: `forge test -vvvv` or `cast run <tx_hash>` (traces print by default; there is no `--trace` flag on `cast run`).
2. Decode custom error selectors against compiled ABIs.
3. Check caller, msg.value, approvals, balances, block timestamp, chain ID, and fork block.
4. Confirm proxy address vs implementation address.

### ABI Or Deployment Drift

When a client error says a function "returned no data", "address is not a contract", or only
`execution reverted`, do not trust the wording until you prove what is deployed.

1. Confirm bytecode exists at the configured address:
   `cast code "$CONTRACT" --rpc-url "$RPC_URL"`.
2. Compute the expected selector:
   `cast sig "openReport(address,string)"`.
3. Check whether the selector appears in deployed bytecode. Absence usually means the ABI/local
   source is ahead of the configured deployment, the app points at an old contract, or a proxy
   target is wrong.
4. Probe nearby known-good reads such as version/config/profile getters. If reads work but the new
   selector is absent, treat it as deployment drift, not a wallet, approval, or token-balance bug.
5. Compare local artifact/deployment records against the live address and update the address book,
   proxy implementation, or deployment before retrying the write.

Useful quick check:

```bash
selector=$(cast sig "openReport(address,string)" | sed 's/^0x//')
code=$(cast code "$CONTRACT" --rpc-url "$RPC_URL")
case "$code" in
  *"$selector"*) echo "selector present" ;;
  *) echo "selector absent: ABI/source likely ahead of deployment" ;;
esac
```

For ETH-less smart-account or account-abstraction senders, a fork trace can fail transaction
validation before contract execution because the sender has no ETH. Override only the simulated
sender balance:

```bash
cast call \
  --rpc-url "$RPC_URL" \
  --from "$SMART_ACCOUNT" \
  --override-balance "$SMART_ACCOUNT:1000000000000000000" \
  --trace \
  "$CONTRACT" \
  "openReport(address,string)(uint64)" \
  "$AUTHOR" \
  "$EVIDENCE_URI"
```

If the trace reverts immediately with no internal calls and the selector is absent from bytecode,
the configured deployment does not implement that function. Fail closed in the app before asking for
token approvals or wallet signatures.

### Account-Abstraction Write Debugging

- Treat bundler/smart-account simulation and return decoding as transport-specific. A batched call
  may surface an account-level empty return even when the contract ABI has a return value.
- For writes where events are the authoritative success proof, consider sending raw calldata for the
  final contract call and validating the receipt/event afterward.
- Always separate capability preflights from money movement: verify chain ID, deployed code,
  selector/proxy target, balance, and allowance before prompting for approvals.
- Do not use a successful ERC-20 `approve` or `transferFrom` simulation as proof the target protocol
  write exists. Token movement can be valid while the configured protocol contract is stale.

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
