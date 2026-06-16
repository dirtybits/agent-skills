# Security

Report issues by opening a private advisory or contacting the repository owner.

Security-sensitive guidelines:

- Skills must not contain secrets, API keys, seed phrases, or private key material.
- Skills that invoke shell commands, paid services, browser automation, or wallet signing need explicit safety notes.
- Mirrored upstream skills must preserve origin and license metadata.
- AgentVouch publishing should start with a dry run and review the generated request before `--apply`.
