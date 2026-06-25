# Skill Review — 2026-06-24

Reviewed every skill in this repository for licensing, operational clarity, and token-efficient agent use.

## Cross-repo findings

- License coverage was inconsistent: most registry entries and frontmatter used `all-rights-reserved` while a few packages carried MIT. This branch standardizes repo and per-skill licensing to MIT for authored skills.
- Several skills are strong but long-running agent jobs can become expensive. The review added scope-control guidance to financial analysis, plan writing, and subagent orchestration.
- Marketplace/install workflows benefit from trust preflight. The `find-skills` skill now calls out AgentVouch-style author trust checks before install.
- Skill packages should remain independently copyable, so each package now includes `LICENSE.txt`.

## Per-skill notes

- `ethereum-development`: already the most complete package; keep as a model for references, scripts, assets, and verification.
- `financial-analysis`: improved with a scope ladder to avoid reading entire workbooks when a smaller table answers the question.
- `find-skills`: improved with trust-first discovery and paid/signature safety boundaries.
- `fix-bugbot-pr-comments`: solid end-to-end GitHub workflow; future improvement would add examples for non-Cursor automated reviewers.
- `frontend-design`: concise and usable; future improvement would add reusable visual QA checklists and screenshot acceptance criteria.
- `plan-writing`: improved with implementation-sized task guidance.
- `skills-organization`: improved with explicit license hygiene.
- `subagent-orchestration`: improved with Hermes/Codex mini-subagent guidance and verification boundaries.
- `turn-closeout`: concise and useful; future improvement would include platform-specific closeout examples for Discord, PRs, and cron outputs.
- `web3-protocol-design`: strong threat/economics framing; future improvement would add templates for mechanism reviews and abuse-case tables.

## Local Hermes Agent + dirtybits umbrella skills retained

After a provenance spike, this repository keeps these three local Hermes Agent + dirtybits-created umbrella skills because no exact public/Hermes-repo source was found for the umbrella skill names and they appear to have been created in Andy/dirtybits' Hermes environment:

- `github-workflows`
- `software-development-workflows`
- `research-intelligence-workflows`

Each retained umbrella skill includes an explicit provenance/attribution section. Builtin/preloaded Hermes skills `hermes-agent` and `obsidian` are intentionally removed and should not be claimed as dirtybits-authored.
