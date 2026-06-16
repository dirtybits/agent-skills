<!--
  Sub-agent prompt template.
  Fill in the brackets and delete any line that doesn't apply.
  The agent sees NONE of your conversation — if it's not written here, it's lost.
  Guidance: ../references/writing-subagent-prompts.md
-->

**Task:** [one sentence — the goal, stated first]

**Context:** [what this project/codebase is, why you're asking, any prior
decisions that constrain the answer — everything the agent can't discover alone]

**Inputs / scope:** [exact paths, directories, IDs, data; the boundary of what
to look at — e.g. "only files under apps/api/src/auth/"]

**Constraints:** [what NOT to touch, change, or assume; anything off-limits]

**Definition of done:** [what "finished" concretely means]

**Return format:** Your final message is consumed programmatically and is not
shown to the user. Return only [the exact shape — e.g. a JSON array of
`{ file, line, issue, severity }`; a `file:line → note` list; a verdict +
one-paragraph reason]. No preamble, no sign-off. If there's nothing to report,
return [the empty case — e.g. `[]`].

**Effort:** [Quick first-match / Medium — check obvious locations and common
conventions / Exhaustive — multiple locations and naming conventions, assume
stragglers, don't stop at the first hit]
