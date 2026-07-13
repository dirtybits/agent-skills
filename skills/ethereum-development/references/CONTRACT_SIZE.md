---
type: Reference
title: "Ethereum Contract Size And Architecture"
description: "Measure deployed runtime, enforce growth budgets, attribute bytecode, and choose safe size-remediation strategies."
resource: "https://github.com/dirtybits/agent-skills/blob/main/skills/ethereum-development/references/CONTRACT_SIZE.md"
tags: ["ethereum", "solidity", "evm", "bytecode", "architecture", "foundry", "security"]
timestamp: "2026-07-10T03:03:42Z"
okf_version: "0.1"
---
# Ethereum Contract Size And Architecture

Use this reference when a Solidity contract is expected to grow materially, approaches a deployment limit, or needs libraries, modules, facets, proxies, or compiler changes to remain deployable.

## Contents

- [Distinguish The Budgets](#distinguish-the-budgets)
- [Runtime-Size Gate](#runtime-size-gate)
- [Attribute Growth Before Optimizing](#attribute-growth-before-optimizing)
- [Remediation Decision Matrix](#remediation-decision-matrix)
- [Strategy Notes](#strategy-notes)
- [Required Verification](#required-verification)
- [Cross-Chain Ports](#cross-chain-ports)
- [Runtime-Size Checker](#runtime-size-checker)

## Distinguish The Budgets

Keep these constraints separate:

- **Deployed runtime size:** code stored and executed at the contract address. EIP-170 caps it at 24,576 bytes on Ethereum-compatible chains that enforce the rule.
- **Creation or init code:** constructor and deployment code. It is not the value reported as deployed runtime and may have separate limits.
- **Transaction gas:** work performed by one call. Affordable execution does not make oversized runtime deployable.
- **Block gas:** aggregate execution capacity. It does not increase the code allowed at one address.
- **Calldata and return data:** per-call encoding costs and limits. Large ABI surfaces also contribute encoder and decoder code to runtime.

Measure the actual deployed artifact. Do not infer deployability from source lines, test gas, creation bytecode, or the size of a source-chain program.

## Runtime-Size Gate

Apply this workflow before and during a substantial feature:

1. Pin the production compiler profile: exact solc version, optimizer enabled flag and runs, EVM target, metadata settings, `viaIR`, remappings, and linked libraries.
2. Build the baseline and record deployed-runtime bytes for every contract expected to grow.
3. Record the target-chain hard limit and choose a project soft limit that reserves room for review fixes and known future work.
4. Implement a representative vertical slice early, then measure its runtime delta before completing the full state machine.
5. Re-measure after each meaningful ABI, lifecycle, inheritance, dependency, or compiler change.
6. Add the soft and hard limits to CI and the deployment checklist.

Report at least:

| Field | Meaning |
|---|---|
| Baseline bytes | Runtime before the feature |
| Current bytes | Runtime from the exact candidate artifact |
| Feature delta | Current minus baseline |
| Hard limit | Target-chain deployment limit |
| Soft limit | Project-approved review and growth budget |
| Hard headroom | Hard limit minus current |
| Soft headroom | Soft limit minus current |

A candidate that exceeds either approved limit is blocked even if every behavioral test passes.

## Attribute Growth Before Optimizing

Use controlled compile experiments. Change one surface at a time and record the byte delta:

- Temporarily remove or stub one feature cluster in an analysis-only branch.
- Compare wide getters against compact fixed views.
- Separate dynamic strings or arrays from frequently used fixed fields.
- Compare duplicated branches against a shared internal helper, while checking whether the optimizer inlines it.
- Compare compatibility wrappers and legacy tuple-return functions individually.
- Compare optimizer runs and `viaIR` without mixing source changes into the experiment.
- Inspect generated dispatch and ABI-encoder code when a small-looking view has a large delta.

Common contributors include:

- wide tuples, nested structs, dynamic arrays, bytes, and strings
- duplicated legacy and new getters
- large branching state machines
- repeated validation, accounting, and transfer paths
- inherited features and compatibility wrappers
- revert strings and generated encoding or decoding helpers

Do not claim a likely saving as headroom. Demonstrate it in the compiled production profile.

## Remediation Decision Matrix

Evaluate every candidate against all columns:

| Strategy | Runtime effect | ABI and storage | Deployment and verification | Security and upgradeability |
|---|---|---|---|---|
| Remove unnecessary mechanism or ABI surface | Often high and durable | May intentionally change new ABI or economics; preserve locked legacy surfaces | Simplest topology | Reduces audit surface if approved explicitly |
| Targeted deduplication and compact views | Low to medium; measure optimizer behavior | Usually no storage change; view shape may change | Minimal | Lowest new authority risk |
| `viaIR` or optimizer changes | Variable; may shrink or grow | No intended ABI or storage change | Exact compiler profile must be pinned and reproducible | Compiler-pipeline change requires full regression and differential review |
| Linked external library | Moves eligible code out of caller runtime | Public or external library logic executes in caller context; internal functions are commonly inlined | Deploy, link, record, and verify each library address | Adds code-address dependency and `delegatecall` review |
| Separate storage-owning feature contract | Creates an independent runtime budget | Introduces explicit cross-contract state, custody, authorization, and ABI boundaries | Deploy and verify another contract; configure addresses and clients | Avoids shared-storage collision but expands call and failure surface |
| Delegate module or facets | Splits logic while sharing caller storage | Requires a frozen or namespaced layout and selector routing rules | Deploy and verify router plus modules or facets | High privilege, storage-collision, selector, and upgrade-key risk |
| Proxy | Makes the entry shell small; does not shrink an oversized implementation | Requires initializer and upgrade-safe storage | Verify proxy and implementation separately | Adds upgrade authority; implementation still must satisfy EIP-170 |

Choose the smallest strategy that provides demonstrated savings plus approved headroom. Do not accumulate several byte tricks when a coherent feature boundary is required.

## Strategy Notes

### Compact ABI Surfaces

View functions are not free. Returning a large struct, especially with dynamic fields, generates runtime ABI-encoding code. Prefer:

- compact fixed views for common reads
- separate detail views for dynamic evidence or history
- pagination for unbounded collections
- events and an indexer for historical enumeration

Appending fields to a returned struct changes its ABI tuple. Test selector stability and old-client decoding whenever compatibility matters.

### Linked Libraries

Moving functions into a library only reduces caller runtime when the compiler emits an external library call. Internal library functions are generally inlined and may produce no saving.

For a linked library:

- resolve every production link reference and record the fully qualified library name, deployed address, and runtime code hash
- preserve the exact link map and compiler inputs in deployment and verification artifacts
- rehearse the real library-to-caller-to-initialization sequence on a local chain
- compare each deployed library's runtime code with the expected artifact and the caller's deployed runtime with the artifact produced from the final link inputs
- verify the library and caller separately using the identical compiler and link map
- review caller-context effects and all arguments as an authorization boundary
- test unresolved, zero, wrong, code-less, and bytecode-mismatched library addresses

### Separate Feature Contracts

Prefer a clear storage-owning feature contract when the feature has a coherent lifecycle and can own its state or custody safely. An ordinary external call cannot directly mutate the caller's storage.

Specify:

- which contract is the source of truth
- where assets and liabilities are held
- who may call each boundary
- how pause, recovery, and failure propagate
- how clients discover and verify both addresses

### Compiler Pipeline

Treat `viaIR` and optimizer changes as experiments before adopting them:

1. Change one compiler setting at a time.
2. Compare exact deployed-runtime bytes and gas snapshots.
3. Re-run unit, fuzz, invariant, fork, ABI, and deployment-script tests.
4. Record solc, optimizer, EVM target, metadata, and library inputs for explorer verification.

Never enable a compiler pipeline silently just to cross a size gate.

### Proxies, Delegate Modules, And Facets

A proxy shell does not remove EIP-170 from its implementation. Use a proxy for upgradeability requirements, not as a false size fix.

Delegate modules and facet systems can distribute logic across multiple deployed code accounts, but they create shared-storage and routing risk. Require:

- namespaced or otherwise frozen storage layout
- collision and selector-conflict tests
- initializer and reinitializer protection
- explicit module or facet authority
- upgrade, rollback, pause, and monitoring procedures

## Required Verification

For any size-remediation change, run and record:

- exact deployed-runtime bytes, delta, hard headroom, and soft headroom
- unit, revert, fuzz, invariant, and fork tests appropriate to the feature
- ABI selector, tuple, event, error, and generated-client parity
- old-client decoding where a legacy ABI is preserved
- storage-layout comparison for any shared-storage or upgradeable design
- gas snapshots for newly externalized calls and paged workflows
- deployment rehearsal with linked addresses, initialization data, and role order
- explorer verification using the exact compiler and linking profile
- failure tests for missing modules, reverting recipients, paused state, retries, and partial progress
- upgrade and rollback tests if mutable routing or implementation authority exists

## Cross-Chain Ports

Preserve approved invariants and economic semantics, not source-chain machinery. Before locking a port, compare:

- deployed code or program-size limits
- per-transaction gas or compute limits
- transaction data and account-input limits
- storage or account ownership model
- cross-contract or cross-program call semantics
- upgrade and verification topology

A source chain may allow a large program while constraining each transaction's compute or account list. An EVM target may allow the call's gas but reject the monolithic runtime at deployment. Budget both dimensions independently.

## Runtime-Size Checker

The bundled checker reads deployed bytecode from Foundry, Hardhat, or standard-json-style artifacts:

    python3 skills/ethereum-development/scripts/check_runtime_size.py \
      out/Core.sol/Core.json \
      --baseline 18000 \
      --soft-limit 22528 \
      --hard-limit 24576 \
      --label Core

The soft limit is a project decision; the example is not a universal requirement.

Exit behavior:

- `0`: within all configured limits
- `1`: hard limit, soft limit, or maximum delta exceeded
- `2`: artifact or argument error

Use `--json` for CI output and `--max-delta` when a feature branch has an approved growth budget.

# Citations

- [EIP-170: Contract code size limit](https://eips.ethereum.org/EIPS/eip-170)
