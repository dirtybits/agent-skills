# Contributing

1. Add or update skills under `skills/<skill-name>/`.
2. Keep `SKILL.md` concise and focused on reusable agent behavior.
3. Add `agents/openai.yaml` when a skill needs human-facing UI metadata.
4. Update `registry.json` with provenance and AgentVouch metadata.
5. Run `npm run kb:format` after metadata/index changes and `npm run validate` before opening a pull request.

Do not add secrets, private key paths, localhost-only workflows, or vendor/plugin cache exports unless the registry entry marks them private and excludes them from publishing.
