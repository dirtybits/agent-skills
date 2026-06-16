/*
 * Orchestration-script scaffold (illustrative, tool-agnostic).
 *
 * Maps onto whatever your harness exposes. Substitute its real primitives:
 *   spawn(prompt, opts)         -> start one sub-agent, await its final message
 *   parallel([() => ...])       -> run thunks concurrently, WAIT FOR ALL (barrier)
 *   pipeline(items, ...stages)  -> push each item through all stages, NO barrier
 *
 * If your harness has no script runner, read this as pseudocode for the shape of
 * the orchestration you'd drive by hand across turns.
 *
 * Principles encoded below:
 *   - prefer pipeline (no barrier) over parallel (barrier) for multi-stage work
 *   - sub-agents can fail -> always filter out null/empty returns
 *   - verify findings before trusting them
 *   - scale the fleet to the task; don't silently cap coverage
 *   - relay the synthesized result; the user never saw the sub-agents
 */

// ── 1. Fan-out: independent work, collect all results ───────────────────────
// Use when items don't depend on each other and you need them all together.
const files = ['a.ts', 'b.ts', 'c.ts'];
const reviews = (await parallel(
  files.map(f => () =>
    spawn(`Review ${f} for bugs. Your output is parsed by a script; return a
           JSON array of { line, issue, severity }. [] if clean.`))
)).filter(Boolean); // drop sub-agents that errored or returned nothing

// ── 2. Pipeline: each item flows through stages independently (DEFAULT) ─────
// File 1's findings get verified while file 5 is still being reviewed.
const verified = await pipeline(
  files,
  // stage 1: review
  f => spawn(`Review ${f} for bugs. Return JSON: { findings: [...] }.`),
  // stage 2: adversarially verify this file's findings as soon as they land
  (review, f) => spawn(`Try to REFUTE each finding for ${f}. Default to
                        refuted=true if unsure. Return { confirmed: [...] }.`)
);

// ── 3. Barrier ONLY when a stage needs the whole previous set ───────────────
// e.g. dedup across every finding before paying for verification.
const all = (await parallel(files.map(f => () =>
  spawn(`Review ${f}. Return { findings: [...] }.`)))).filter(Boolean);
const deduped = dedupeByFileAndLine(all.flatMap(r => r.findings)); // needs ALL at once
const confirmed = await parallel(deduped.map(finding => () =>
  spawn(`Verify this finding, default to refuted if unsure: ${JSON.stringify(finding)}`)));

// ── 4. Loop-until-dry: unknown-size discovery ───────────────────────────────
const seen = new Set();
let dryRounds = 0;
while (dryRounds < 2) {                       // stop after 2 empty rounds
  const round = await spawn(`Find issues NOT already in this list:
                             ${JSON.stringify([...seen])}. Return { items: [...] }.`);
  const fresh = (round?.items ?? []).filter(i => !seen.has(key(i)));
  if (!fresh.length) { dryRounds++; continue; }
  dryRounds = 0;
  fresh.forEach(i => seen.add(key(i)));        // dedup vs ALL seen, not just kept
}

// ── 5. Synthesize and hand back ─────────────────────────────────────────────
// The user saw none of the above. Summarize the outcome for them — and if you
// capped coverage anywhere (sampling, top-N, no retries), say so explicitly.
return summarize(verified);
