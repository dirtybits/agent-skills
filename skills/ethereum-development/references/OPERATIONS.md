---
type: Reference
title: "Ethereum Development Operations"
description: "Operational guidance for EVM key custody, RPC preflight, deterministic deployments, finalized readers, cross-chain configuration, and off-chain consumers."
resource: "https://github.com/dirtybits/agent-skills/blob/main/skills/ethereum-development/references/OPERATIONS.md"
tags: ["ethereum", "solidity", "evm", "smart-contracts", "foundry", "hardhat", "security", "dapp", "reference"]
timestamp: "2026-07-19T08:54:57Z"
okf_version: "0.1"
---
# EVM Operations And Custody

Use this reference for public-network signing, Safe workflows, deterministic deployments across multiple EVM chains, finalized event readers, and integrations where an off-chain producer publishes data for an indexer, relayer, or executor.

## Contents

- [Evidence Model](#evidence-model)
- [Keystores And Custody](#keystores-and-custody)
- [RPC Selection And Preflight](#rpc-selection-and-preflight)
- [Deterministic Multi-Chain Deployment](#deterministic-multi-chain-deployment)
- [Directional Cross-Chain Configuration](#directional-cross-chain-configuration)
- [Finalized Event Readers](#finalized-event-readers)
- [Off-Chain Producers And Consumers](#off-chain-producers-and-consumers)

## Evidence Model

Track operational states independently:

1. Implemented and locally tested.
2. Simulated against the target chain.
3. Broadcast and mined successfully.
4. Deployed code and configuration independently verified.
5. Source event observed at the required finality.
6. Off-chain artifact signed and stored.
7. Artifact publicly served under the expected API contract.
8. External indexer or relayer recognizes and consumes it.
9. Executor submits the destination transaction.
10. Destination state and application delivery are confirmed.

Evidence at one stage does not imply a later stage. In particular, a valid API response or successful destination `eth_call` proves neither indexer discovery nor execution.

## Keystores And Custody

### Define Roles First

List each signer role before creating keys:

- temporary deployer
- final contract owner or admin
- Safe owner
- transaction proposer
- gas-paying executor or relayer
- service or attestation signer
- pause or emergency authority

Do not silently collapse these roles. Creating or possessing a key is not approval to grant its address authority.

A Safe has no private key. It is a contract whose transactions require its configured owner threshold. Foundry keystores belong only to individual owners or operational EOAs. Review Safe address, chain ID, version, owners, threshold, Safe nonce, target, value, decoded calldata, and Safe transaction hash before collecting signatures. No one operator should control enough owner credentials to satisfy the production threshold.

Exportable Foundry keys can be reasonable for isolated testnet work. Production owners and service signers should use independently controlled hardware wallets or an approved non-exportable KMS/HSM design. Storing an encrypted keystore and its password in the same password manager item is a test convenience, not separation of custody.

### Foundry Keystore Pattern

Prefer the explicit keystore file. A directory passed to `--keystore` may be ambiguous or rejected, and `--account` depends on local account-name resolution.

Use a real temporary file for the password. Some tools reject process-substitution paths such as `/dev/fd/11`; clipboard workflows also leave unnecessary exposure and invite newline or stale-value mistakes.

```bash
(
  set -euo pipefail
  umask 077

  KEYSTORE="$HOME/.foundry/keystores/<account-name>"
  PASSWORD_REF='op://<vault>/<item>/password'
  EXPECTED_SIGNER='0x...'
  PASSWORD_FILE="$(mktemp "${TMPDIR:-/tmp}/foundry-password.XXXXXX")"
  trap 'rm -f "$PASSWORD_FILE"' EXIT HUP INT TERM
  chmod 600 "$PASSWORD_FILE"

  op read -n "$PASSWORD_REF" >"$PASSWORD_FILE"

  ACTUAL_SIGNER="$(cast wallet address \
    --keystore "$KEYSTORE" \
    --password-file "$PASSWORD_FILE")"

  actual_normalized="$(printf '%s' "$ACTUAL_SIGNER" | tr '[:upper:]' '[:lower:]')"
  expected_normalized="$(printf '%s' "$EXPECTED_SIGNER" | tr '[:upper:]' '[:lower:]')"

  test "$actual_normalized" = "$expected_normalized" || {
    printf 'STOP: signer mismatch: expected %s, got %s\n' \
      "$EXPECTED_SIGNER" "$ACTUAL_SIGNER" >&2
    exit 1
  }

  # Put the reviewed cast or forge command here and pass:
  #   --keystore "$KEYSTORE" --password-file "$PASSWORD_FILE"
)
```

For test-key creation helpers:

- set the keystore directory to `0700` and files to `0600`
- use `umask 077`
- never overwrite an existing keystore
- stop if the stored password cannot decrypt the existing keystore
- derive and record only the public address
- use distinct passwords and password-manager items per account
- if backing up encrypted keystores, download and compare the attachment byte-for-byte
- never print private keys, mnemonics, passwords, resolved secret URLs, or signed raw transactions

Keep local environment files git-ignored and limited to public addresses plus secret references such as `op://...`. Resolve those references at command runtime; do not source a file containing resolved RPC credentials or keystore passwords into a long-lived shell.

## RPC Selection And Preflight

Authenticated RPCs improve availability, quotas, historical access, and isolation from shared public traffic. They do not conceal signed transactions, contract deployments, calldata, logs, or public state.

A public unauthenticated RPC may be acceptable for a bounded testnet smoke if every write and postcondition is independently verified. It should not be the only production event source or authority for deciding whether to retry a write.

Before relying on an endpoint, verify the exact capabilities the workflow needs:

```bash
cast chain-id --rpc-url "$RPC_URL"
cast nonce "$SIGNER" --block latest --rpc-url "$RPC_URL"
cast nonce "$SIGNER" --block pending --rpc-url "$RPC_URL"
cast block safe --field number --rpc-url "$RPC_URL"
cast block finalized --field number --rpc-url "$RPC_URL"
```

Also test historical logs, archive reads, batch limits, response-size limits, rate limits, and HTTP versus WebSocket transport as applicable. If the workflow requires `safe` or `finalized` and the endpoint does not implement it correctly, fail closed rather than silently falling back to `latest`.

Public providers can lag after a write. Before resending after a timeout or transport error:

1. Check the transaction hash if one was produced.
2. Compare latest and pending nonce.
3. Query the receipt and affected state through an independent endpoint or explorer.
4. Retry only after determining that the original transaction did not propagate.

## Deterministic Multi-Chain Deployment

CREATE addresses depend on deployer and nonce. Matching addresses across chains require the same deployer address and matching nonce at each deployment. CREATE2 additionally requires matching deployer, salt, and init-code hash.

```bash
cast nonce "$DEPLOYER" --block latest --rpc-url "$RPC_A"
cast nonce "$DEPLOYER" --block latest --rpc-url "$RPC_B"
cast compute-address "$DEPLOYER" --nonce "$EXPECTED_NONCE"
```

Before every broadcast:

- recheck latest and pending nonce on that chain
- prevent concurrent sends from the deployer
- record the expected address
- simulate the exact constructor and linked-library inputs
- use the explicit nonce only after the checkpoint passes

After every broadcast, record receipt status, transaction hash, block number, gas used, deployed address, and runtime code hash. Verify through an independent source before advancing the nonce sequence. Matching addresses do not prove matching bytecode, constructor state, ownership, or configuration.

## Directional Cross-Chain Configuration

Cross-chain configuration is easy to reverse because one chain's local selector is the other chain's remote selector. Name variables by role, for example `SOURCE_CHAIN_SELECTOR`, `DEST_CHAIN_SELECTOR`, `SOURCE_ROUTER`, and `DEST_OFFRAMP`; avoid context-free names such as `CHAIN_SELECTOR` or `REMOTE`.

For each lane or route:

1. Confirm the deployed contract version on both chains.
2. Derive routers, ramps, selectors, and security dependencies from authoritative directories and live contract getters.
3. Decode and record the exact update tuple before signing.
4. Simulate the update from the real authority.
5. Submit one bounded change.
6. Read the corresponding getter immediately afterward and compare every field.

Do not infer an event schema from source code on another version. Match the ABI to the deployed bytecode and distinguish indexed topics from data fields. When a protocol defines an identifier as a hash of canonical wire bytes, hash those exact bytes; do not rebuild an assumed equivalent encoding from decoded fields.

## Finalized Event Readers

An event reader that causes signing, settlement, bridging, or another irreversible action needs an explicit finality policy.

- Read only through the required `safe` or `finalized` head, or through a documented chain-specific confirmation rule.
- Record event block number, block hash, transaction hash, and log index.
- Re-read the block hash at the finality checkpoint before acting.
- Store cursor updates transactionally with derived work or make replay idempotent.
- Bound log ranges and retry with backoff for provider limits.
- Treat removed logs and reorgs as normal operational inputs.
- Verify chain or protocol emergency state before producing an artifact.

Requested finality and RPC support are separate facts. A payload asking for finality does not prove the RPC supplied a finalized snapshot.

## Off-Chain Producers And Consumers

For APIs that publish proofs, signatures, quotes, or execution inputs:

- conform to the exact OpenAPI or protocol schema, including batch semantics, status codes, numeric precision, and error behavior
- expose readiness only when durable dependencies are available; do not silently fall back to ephemeral storage in a production command
- record whether the external indexer recognizes the producer identity and knows its storage location
- monitor producer availability, indexer polling, retry-window age, executor status, and destination state separately
- keep submitters idempotent and bind every artifact to the full security-relevant payload

A destination verifier accepting an artifact in `eth_call` is valuable contract-path evidence. It still does not prove that the indexer discovered the artifact, the executor fetched it, a transaction was submitted, or the destination application received it.

When an external retry window expires, coordinate reindexing or send a fresh test input rather than assuming publication will eventually trigger execution. Do not invoke manual execution paths unless that action is explicitly reviewed and approved.
