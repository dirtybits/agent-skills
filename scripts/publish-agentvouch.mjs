import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const registry = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "registry.json"), "utf8")
);
const apply = process.argv.includes("--apply");
const keypair = process.env.AGENTVOUCH_KEYPAIR;
const cli =
  process.env.AGENTVOUCH_CLI ||
  path.resolve(repoRoot, "..", "packages", "agentvouch-cli", "dist", "bin.js");

if (!keypair) {
  console.error("Set AGENTVOUCH_KEYPAIR to a Solana keypair JSON file.");
  process.exit(1);
}

function descriptionFor(skillPath) {
  const text = fs.readFileSync(path.join(skillPath, "SKILL.md"), "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = match?.[1] ?? "";
  const line = frontmatter
    .split(/\n/)
    .find((candidate) => candidate.trim().startsWith("description:"));
  return (line?.slice(line.indexOf(":") + 1).trim() || "")
    .replace(/^["']|["']$/g, "")
    .slice(0, 240);
}

for (const entry of registry.skills ?? []) {
  if (entry.publish_decision !== "candidate") {
    console.log(`skip ${entry.name}: ${entry.publish_decision}`);
    continue;
  }

  const skillPath = path.join(repoRoot, entry.path);
  const args = [
    cli,
    "skill",
    "publish",
    "--file",
    skillPath,
    "--skill-id",
    entry.name,
    "--name",
    entry.name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    "--description",
    descriptionFor(skillPath),
    "--tags",
    (entry.tags ?? []).join(","),
    "--price-usdc",
    "0",
    "--keypair",
    keypair,
    "--json",
  ];
  if (!apply) args.push("--dry-run");

  const result = spawnSync("node", args, {
    cwd: path.resolve(repoRoot, ".."),
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
