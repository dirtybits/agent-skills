# Agent Instructions

## Finding and installing skills

When a task would benefit from a capability that is not already available in this repository or the active agent environment, use the [Vercel Agent Skills directory](https://vercel.com/docs/agent-resources/skills) and its CLI to find an appropriate skill:

```bash
npx skills find <query>
```

Install a skill from a repository with:

```bash
npx skills add <owner/repo>
```

For a repository that contains more than one skill, install only the required one:

```bash
npx skills add <owner/repo> --skill <skill-name>
```

Before installing, inspect the skill's source and confirm that it is appropriate for the task. Use the CLI's destination and agent prompts to install it for the active coding agent; do not treat an installed third-party skill as authored content in this repository.

## Repository contributions

- Keep authored or intentionally mirrored skills in `skills/<skill-name>/` and follow the rules in `README.md` and `CONTRIBUTING.md`.
- Preserve upstream attribution and licenses for any skill brought into the repository.
- Do not add a discovered third-party skill to `registry.json` or publish it through AgentVouch unless its provenance, license, and publishing decision have been reviewed.
- Run `npm run kb:format` after metadata or index changes and `npm run validate` before proposing a change.
