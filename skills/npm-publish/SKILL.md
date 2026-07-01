---
type: Skill
title: "Npm Publish"
resource: "https://github.com/dirtybits/agent-skills/tree/main/skills/npm-publish"
tags: ["npm", "node", "release", "publishing", "workflow"]
timestamp: "2026-06-30T23:59:00Z"
okf_version: "0.1"
name: npm-publish
description: "Use when publishing Node/npm packages from a repository or monorepo, especially scoped public packages, beta/latest dist-tags, workspace publishing, npm 2FA, publish verification, local tarball smoke tests, and debugging npm publish/install errors such as E403, E404, ENOVERSIONS, ELOOP, or pack destination failures."
version: 1.0.0
author: dirtybits
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [npm, node, package-release, dist-tags, two-factor-auth, monorepo]
    related_skills: [github-workflows, software-development-workflows]
---
# Npm Publish

## Operating Pattern

Use this workflow when preparing, publishing, or verifying an npm package. Treat publishing as a release operation: package versions are immutable, registry state can lag or be filtered by local config, and npm auth errors can look unrelated to the tarball.

1. **Confirm package scope and working directory.**
   - In a monorepo, publish from the repo root with `npm publish --workspace <workspace-name> ...`.
   - From the package directory, omit `--workspace`.
   - Confirm `package.json` has the intended `name`, `version`, `license`, `bin`, `files`, `engines`, `publishConfig`, and dependencies.
2. **Confirm the version is new.**
   - npm versions are immutable. Any republish requires a version bump.
   - Check existing versions: `npm view <package> versions dist-tags --json`.
3. **Run release checks before publishing.**
   - Use the repo's normal quality gates, usually format, tests, and build.
   - If a repo-wide build fails for local env state, diagnose before assuming package failure.
4. **Pack and smoke-test the exact artifact.**
   - Create the pack destination first; npm does not create it.
   - Install the generated tarball globally or in a temp project and run the package's CLI/help/version smoke tests.
5. **Publish with intentional dist-tags.**
   - Use `--tag beta` for beta/devnet/prerelease packages.
   - Use `latest` only when the package should be the default install.
6. **Verify registry state and installability.**
   - A successful publish prints `+ <package>@<version>`.
   - Verify package document, dist-tags, access, tarball metadata, and install from a clean npm config or a deliberate security-guard override.

## Recommended Command Skeleton

For a workspace package from the repository root:

```bash
git switch main
git pull

npm run format:check
npm run test --workspace <workspace-name>
npm run build

mkdir -p /private/tmp/npm-release
npm pack --workspace <workspace-name> --pack-destination /private/tmp/npm-release

npm uninstall -g <package-name>
npm install -g /private/tmp/npm-release/<tarball-name>.tgz
<binary-name> --version
<binary-name> --help

npm whoami
npm publish --workspace <workspace-name> --tag beta --access public
```

For `@agentvouch/cli`, the publish command is:

```bash
npm publish --workspace @agentvouch/cli --tag beta --access public
```

## Dist-Tag Policy

- Publish beta/devnet releases with `--tag beta`.
- After publish, inspect tags:

```bash
npm view <package> dist-tags versions --json
```

- If users should install the package by default without a tag, intentionally move `latest`:

```bash
npm dist-tag add <package>@<version> latest
```

Do not move `latest` automatically. Report the current tag state and ask whether the package should become the default install when that is a product decision.

## Verification Commands

Use several independent checks:

```bash
npm view <package> dist-tags versions engines bin --json
npm access get status <package>
npm owner ls <package>
npm access list collaborators <package>
mkdir -p /private/tmp/npm-verify
npm pack <package>@<tag-or-version> --pack-destination /private/tmp/npm-verify
```

Then install and smoke-test from the registry in an environment that can see fresh packages:

```bash
npm install -g <package>@<tag-or-version>
<binary-name> --help
```

If the user's npm config intentionally sets a `before` date as a supply-chain safety guard, keep it. Do not tell them to delete it as the default fix. For fresh-release verification, use one of:

- a separate clean environment or user config;
- direct registry reads such as `npm view <package> ...`;
- an explicit `--before=<future ISO date after the publish time>` override for the one verification command.

If `npm install` reports `ENOVERSIONS` while `npm view` shows versions, check:

```bash
npm config get before
```

A `before` date earlier than the publish timestamp hides the new version from install resolution.

## Error Triage

### `ELOOP` loading env during repo build

If a pre-publish build fails with a message like:

```text
ELOOP: too many symbolic links encountered, stat '<repo>/web/.env.local'
```

Check whether the env file is a self-referential symlink:

```bash
ls -l web/.env.local
```

Move the broken symlink out of the app directory and recreate `.env.local` as a real file if needed. Do not treat this as an npm packaging failure.

### `npm pack --pack-destination` returns `ENOENT`

`npm pack --pack-destination <dir>` does not create `<dir>`. Create it first:

```bash
mkdir -p /private/tmp/npm-release
npm pack --workspace <workspace-name> --pack-destination /private/tmp/npm-release
```

### `E403` requiring 2FA or bypass token

The tarball may be fine; npm is rejecting registry write auth. Refresh auth and retry:

```bash
npm logout
npm login --auth-type=web
npm whoami
npm publish --workspace <workspace-name> --tag beta --access public
```

If npm prompts for an OTP, use a fresh 2FA code immediately:

```bash
npm publish --workspace <workspace-name> --tag beta --access public --otp <code>
```

Recovery codes can satisfy npm's OTP prompt, but they are one-time backup factors. If a recovery code is used or exposed in logs/chat, treat it as spent and regenerate recovery codes after publishing.

### `PUT ... 404 Not found` during publish

If publish reaches `Publishing to https://registry.npmjs.org/` and then fails with `PUT ... 404`, the tarball built but npm did not accept the registry write. Check:

```bash
npm config get registry
npm whoami
npm owner ls <package>
npm access get status <package>
```

For scoped public packages, keep `--access public`. Re-login with `npm login --auth-type=web` if the current session or token lacks publish rights.

### `ENOVERSIONS` after publish

If the registry document shows the version but install says no versions are available, suspect a local `before` security guard:

```bash
npm config get before
npm view <package> time dist-tags versions --json
```

Compare the package publish time to the configured `before` date. Preserve the guard unless the user explicitly wants it removed.

## Completion Criteria

Report:

- the package name, version, and dist-tags;
- whether `latest` changed;
- package access status;
- tarball file count/size when available;
- CLI smoke-test output or exact failure;
- any local npm guardrail such as `before` that affected verification.
