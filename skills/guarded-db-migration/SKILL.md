---
type: Skill
name: guarded-db-migration
title: "Guarded DB Migration"
description: Run production database schema changes without incidents, split additive runtime DDL from risky one-shot migrations, guard migration scripts with an expected-host check and a read-only preflight, rehearse the exact command on a disposable branch copied from production (Neon or similar branching Postgres), and verify with post-run catalog queries plus an API smoke. Use whenever adding indexes or constraints, changing primary keys, backfilling, dropping anything, or running any script against a production database URL.
resource: "https://github.com/dirtybits/agent-skills/tree/main/skills/guarded-db-migration"
tags: ["database", "postgres", "migrations", "neon", "operations", "safety"]
timestamp: "2026-07-06T20:00:00Z"
okf_version: "0.1"
license: MIT
---

# Guarded DB Migration

## Why this skill exists

The two classic agent-caused database incidents are: (1) risky DDL placed in a request-time schema initializer, so the first failure takes down every route that touches the table; and (2) a migration script pointed at the wrong database — a legacy project, a teammate's branch, production instead of staging — because the connection string was ambient. Both are fully preventable with three habits: the additive/guarded split, the expected-host guard, and a rehearsal on a disposable copy of production.

## 1. The additive/guarded split (decide where the DDL lives)

**Runtime schema initializers** (code that runs `CREATE TABLE IF NOT EXISTS` on boot or first request) may contain **only** additive, race-tolerant, cannot-fail-on-live-data statements:

- `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` (non-unique), `ADD COLUMN IF NOT EXISTS`
- Idempotent backfills that tolerate concurrent execution

**Everything that can fail on live data goes in a guarded one-shot script** — never in the initializer:

- `CREATE UNIQUE INDEX` (fails on existing duplicates)
- `DROP` anything, `ALTER ... DROP CONSTRAINT`, primary-key swaps
- Backfills that assume exclusive access or specific data shape
- Anything requiring a duplicate scan or data repair first

Rule of thumb: if the statement could throw because of the *data* (not just the schema), it is one-shot-script material.

## 2. The guarded one-shot script pattern

Write the migration as a standalone script (e.g. `scripts/<name>-migration.ts`) with two subcommands:

```
<script> preflight   # read-only: reports duplicates/violations/row counts; exit nonzero if migrate would fail
<script> migrate     # performs the DDL, in order, inside the smallest safe transaction scope
```

Non-negotiable guards in `migrate`:

1. **Expected-host guard.** The script takes `EXPECTED_DATABASE_HOST` (or equivalent) and refuses to run unless it matches the host parsed from `DATABASE_URL`. This converts "wrong ambient connection string" from an incident into an error message. Never default it; never allow a bypass flag.
2. **Preflight-first.** `migrate` re-runs the preflight checks internally before DDL — the world may have changed since you ran `preflight` manually.
3. **Idempotence or a clear refusal.** Running `migrate` twice must either be a no-op or fail loudly before touching anything.
4. **Print everything.** Target host, database, each statement as it runs, and a post-run verification summary. The transcript is the evidence.

## 3. Rehearse on a disposable copy of production

Before running `migrate` against production, rehearse the **exact command** on a disposable branch/copy of the production database (Neon branches, RDS clone, `pg_dump`+restore — whatever the platform gives you):

1. Create the branch **from the intended production project**, not from staging — and double-check which project you are in first. Multi-project setups (a live project plus a legacy one, or platform-managed vs hand-created) are where wrong-target incidents come from; verify with the platform CLI (`neonctl projects list`, connection-string host) before branching.
2. Run `preflight` then `migrate` against the branch with the same env-guard values you will use in production (pointed at the branch host).
3. Capture: target host/database, guard output, preflight report, each DDL success, and the post-run checks.
4. Delete the branch after. The rehearsal's purpose is proving the *script and SQL order execute end-to-end on production-shaped data* — not just finding duplicates (preflight already does that read-only against live).

## 4. The live run and verification

1. Run `preflight` against production (read-only) and read the report.
2. Fix any data issues it surfaces (as their own reviewed step — data repair is not a side effect of a migration).
3. Run `migrate` with the production `EXPECTED_DATABASE_HOST`.
4. **Verify with catalog queries**, not vibes: `pg_indexes` for new indexes, `information_schema.table_constraints` for constraints, targeted `SELECT`s for backfills.
5. **Smoke the application**: hit the production API endpoints that read/write the touched tables and confirm 200s and sane payloads.
6. Record the whole thing (host, outputs, verification) in the plan/PR that shipped the migration.

## 5. Design rules that keep migrations boring

- **Additive first, destructive later (or never).** Ship the new column/index/unique-check alongside the old shape; move reads/writes over; only drop the legacy shape when a real conflict forces it. A legacy PK plus an additive chain/tenant-qualified unique index is a fine steady state for a long time.
- **Never let application code depend on a migration having run.** Deploy order: migration first, then code that requires it — or code that tolerates both shapes.
- **Local and production may point at different branches.** Before treating a data mismatch as a code regression, compare the local env's database host with production's.
- **One migration = one reviewable script + one PR**, with the rehearsal evidence in the description.

## 6. Checklist (copy into the migration PR)

- [ ] Risky DDL is in a guarded one-shot script, not a runtime initializer
- [ ] Script has `preflight` (read-only) and `migrate` (host-guarded, idempotent, verbose)
- [ ] Confirmed the target project/host is the live one (not a legacy/stale project)
- [ ] Rehearsed the exact `migrate` command on a disposable branch copied from production; evidence captured
- [ ] Production `preflight` clean (or data repaired in a reviewed step)
- [ ] Production `migrate` run with the expected-host guard; transcript captured
- [ ] Post-run catalog verification (`pg_indexes` / constraints / backfill counts) recorded
- [ ] Production API smoke on affected endpoints recorded
- [ ] Rollback story written down (even if it is "additive change; rollback = ignore the new column")
