---
type: Skill
title: "Research Intelligence Workflows"
resource: "https://github.com/dirtybits/agent-skills/tree/main/skills/research-intelligence-workflows"
tags: ["research", "papers", "markets", "feeds", "workflow"]
timestamp: "2026-06-25T06:43:10Z"
okf_version: "0.1"
name: research-intelligence-workflows
description: "Use when researching papers, feeds, markets, knowledge bases, or long-form research outputs: arXiv, blog/RSS monitoring, LLM wiki knowledge bases, Polymarket, and paper-writing workflows."
version: 1.0.0
author: Hermes Agent + dirtybits
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [research, arxiv, rss, papers, knowledge-base, markets, polymarket, literature]
    related_skills: []
---
# Research Intelligence Workflows

## Overview

This umbrella covers research discovery, monitoring, synthesis, and research-output drafting. Use it when the task is to find current sources, monitor feeds, query markets, build/query a knowledge base, or write academic/research documents.

The shared discipline is source-grounded work: collect real sources, preserve identifiers/URLs, separate evidence from interpretation, and cite or archive enough context to reproduce the result.

## When to Use

- Search arXiv by keyword, author, category, or ID.
- Monitor RSS/Atom/blog feeds and summarize changes.
- Build/query an LLM or markdown knowledge base.
- Query Polymarket markets, orderbooks, prices, or history.
- Plan/write ML research papers, related work, experiments, and submission checklists.

## Workflow

1. **Define the research question.** Scope domain, timeframe, required freshness, and output format.
2. **Collect primary sources first.** Prefer official APIs/pages, arXiv IDs, feed URLs, market IDs, or source documents.
3. **Normalize identifiers.** Record arXiv IDs, DOI/URL, feed URL, market slug/condition ID, or note path.
4. **Extract enough detail.** Titles, authors, dates, abstracts/snippets, metrics/prices, and quoted evidence where needed.
5. **Synthesize with uncertainty.** Distinguish fact, inference, and recommendation.
6. **Archive/reproduce.** Save queries, scripts, source lists, or output paths when the work is likely to be revisited.

## Labeled Subsections from Former Narrow Skills

### arXiv and paper discovery

- Use precise query fields when possible and preserve arXiv IDs/versions.
- For literature reviews, cluster papers by method/task/evaluation instead of listing chronologically.

### Blog/RSS monitoring

- Keep feed URLs explicit, deduplicate by stable entry IDs/links, and compare against the previous checkpoint when monitoring.
- Summaries should emphasize what changed and why it matters.

### LLM wiki / knowledge-base work

- Treat the KB as a graph of markdown notes: stable filenames, backlinks, summaries, and explicit source notes.
- Query results should cite note paths and avoid overconfident synthesis when the KB is sparse.
- For portable agent-consumable KBs, prefer OKF-inspired Markdown: concept documents with YAML frontmatter (`type`, `title` or `name`, `description`, `tags`, `timestamp`, optional `resource`/`okf_version`), normal Markdown links as graph edges, `index.md` for progressive disclosure, and `log.md` for semantic update history.
- Keep consumption permissive but production strict: readers should tolerate unknown types/fields and some broken links, while repo CI should validate metadata shape, internal links, reserved-file rules, and registry/frontmatter consistency before publishing.

### Polymarket and market intelligence

- Resolve market IDs/slugs before querying prices or orderbooks.
- Report timestamp, bid/ask/last, liquidity, and source endpoint; do not treat market odds as ground truth.

### Research paper writing

- Start from contribution and evidence, not template filling.
- Maintain experiment tables, ablation plans, related-work clusters, limitations, and venue-specific checklist items.
- Do not fabricate results, citations, or reviewer claims.

## Preserved Detail

Former standalone skill packages are preserved under `references/absorbed-packages/<skill-name>/` with their original relative layout. Treat that directory as the old skill root when consulting old support files.

## Verification Checklist

- [ ] Research scope and freshness requirements are explicit.
- [ ] Primary sources/API results were collected with stable identifiers.
- [ ] Claims are tied to source URLs/IDs/paths.
- [ ] Output separates evidence, synthesis, and recommendation.
- [ ] Any saved archive/path/query is reported.

## Provenance and Attribution

This is a local Hermes Agent + dirtybits-created umbrella skill from Andy/dirtybits' Hermes environment. A 2026-06-25 provenance spike found no exact public web/GitHub/Hermes-repo match for `name: research-intelligence-workflows`.

It consolidates older local research skills under `references/absorbed-packages/`. Preserve each absorbed package's original frontmatter, author, license, and attribution when redistributing. Notable third-party/adapted sources include `blogwatcher` by JulienTant/Hyaxia and `research-paper-writing` by Orchestra Research.
