---
type: Skill
name: x-integration
title: "X (Twitter) Integration"
description: Post tweets, like, reply, retweet, and quote-tweet by driving the user's real Chrome X session with Playwright. Use for posting to X without the paid API, when the user says "post a tweet", "reply to this tweet", "retweet", or "quote tweet".
resource: "https://github.com/dirtybits/agent-skills/tree/main/skills/x-integration"
tags: ["twitter", "x", "social-media", "playwright", "automation"]
timestamp: "2026-09-16T00:00:00Z"
okf_version: "0.1"
license: MIT
---

# X (Twitter) Integration

Publish and engage on X by driving the user's real Chrome profile (real browser fingerprint, persistent login session) with Playwright. This avoids the paid X API for posting, which otherwise requires a $100+/month tier.

Provenance: adapted from `nanocoai/nanoclaw-skills` (plugins/nanoclaw-skills/skills/x-integration), MIT-licensed by NanoCo.ai, for use outside the NanoClaw platform (standalone Hermes/agent environments on Linux).

## Why browser automation instead of the API

- Posting via the official API is gated behind expensive tiers.
- Headless bot browsers are fingerprinted and banned; a real user Chrome profile with a manually completed login is not.
- One-time manual login; the session persists in the profile directory.

## Setup

### 1. Copy the skill scripts

The `scripts/` and `lib/` directories in this package are self-contained. Copy them (or the whole package) next to where the agent runs commands.

### 2. Install dependencies

```bash
npm install playwright tsx
```

Use the system Chrome/Chromium via `CHROME_PATH` — do not run `npx playwright install`, which downloads a separate browser and is not needed.

### 3. Configure environment

| Variable | Required | Description |
| --- | --- | --- |
| `NANOCLAW_ROOT` | yes | Data root. Holds `data/x-browser-profile/` (Chrome profile with session cookies — sensitive) and `data/x-auth.json` (auth marker). Use a different root per X account. |
| `CHROME_PATH` | yes | Absolute path to the Chrome/Chromium executable. |
| `DISPLAY` | Linux only | X display to launch on (e.g. `:0`). Headful only; there is no headless mode by design. |

### 4. Authenticate (owner action)

```bash
npx tsx scripts/setup.ts
```

This opens Chrome at x.com/login. **The account owner logs in manually** — the agent never types credentials. After the home feed is visible, the script prompt is answered with Enter and login is verified. Success writes `{"authenticated": true, ...}` to `<NANOCLAW_ROOT>/data/x-auth.json`.

## Usage

All scripts read one JSON object on stdin and print one JSON result line.

```bash
# Post
echo '{"content":"Hello world!"}' | npx tsx scripts/post.ts

# Like
echo '{"tweetUrl":"https://x.com/user/status/123"}' | npx tsx scripts/like.ts

# Reply
echo '{"tweetUrl":"https://x.com/user/status/123","content":"Nice"}' | npx tsx scripts/reply.ts

# Retweet (no comment)
echo '{"tweetUrl":"https://x.com/user/status/123"}' | npx tsx scripts/retweet.ts

# Quote-tweet
echo '{"tweetUrl":"https://x.com/user/status/123","content":"my take"}' | npx tsx scripts/quote.ts
```

Success: `{"success":true,"message":"Tweet posted: ..."}`. A `success:false` result (login expired, over 280 chars, post button disabled) is final — fix the cause; do not blindly retry.

## Multi-account

Each X account gets its own `NANOCLAW_ROOT` (isolated profile + login). Never share a profile between accounts, and never run two accounts' scripts concurrently — X will see two sessions from one fingerprint acting at once.

## Hard rules

- Never post without explicit per-post user approval (draft → approve → post).
- Login is the owner's action only; never type credentials.
- 280-character limit is enforced by the scripts; threads are multiple sequential posts.
- Keep volume human-plausible to avoid account action.

## Pitfalls

- **Login expired** (`X login expired` / `Could not verify login status`): re-run setup (step 4) with the same root.
- **Chrome won't launch**: a zombie Chrome holding the profile blocks the lock files the scripts clean. Kill it first (`pkill -f <profile-dir>`), then remove `data/x-browser-profile/Singleton{Lock,Socket,Cookie}`.
- **No display / headless CI**: will not work; this is headful by design.
- **Selector drift**: X changes `data-testid` attributes over time. If a script fails on a missing element, diff the selectors in `scripts/*.ts` against the live DOM and patch the skill.

## Files

- [Skill definition](SKILL.md) - This entrypoint.
- `scripts/setup.ts` - Interactive login (PTY; owner presses Enter when done).
- `scripts/post.ts`, `scripts/like.ts`, `scripts/reply.ts`, `scripts/retweet.ts`, `scripts/quote.ts` - Actions.
- `lib/browser.ts` - Shared utilities: persistent context, tweet navigation, content validation.
- `lib/config.ts` - Chrome path, data dirs, timeouts, launch args.
