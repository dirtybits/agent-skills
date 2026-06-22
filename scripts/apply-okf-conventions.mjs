import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const now = process.env.OKF_TIMESTAMP || new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const registry = JSON.parse(fs.readFileSync(path.join(repoRoot, "registry.json"), "utf8"));

function titleize(name) {
  return name
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function quoteYaml(value) {
  return JSON.stringify(String(value));
}

function inlineList(values = []) {
  return `[${values.map((value) => quoteYaml(value)).join(", ")}]`;
}

function splitFrontmatter(text) {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return null;
  return {
    raw: text.slice(4, end),
    body: text.slice(end + 5).replace(/^\n/, ""),
  };
}

function hasTopLevelKey(raw, key) {
  return new RegExp(`^${key}:`, "m").test(raw);
}

function ensureFrontmatter(file, additions) {
  const text = fs.readFileSync(file, "utf8");
  const parsed = splitFrontmatter(text);
  const raw = parsed?.raw ?? "";
  const body = parsed?.body ?? text;
  const missing = Object.entries(additions).filter(([key]) => !hasTopLevelKey(raw, key));
  if (missing.length === 0 && parsed) return;

  const lines = ["---"];
  for (const [key, value] of missing) lines.push(`${key}: ${value}`);
  if (raw.trim()) lines.push(raw.trimEnd());
  lines.push("---", "");
  fs.writeFileSync(file, lines.join("\n") + body, "utf8");
}

function frontmatterValue(file, key) {
  const parsed = splitFrontmatter(fs.readFileSync(file, "utf8"));
  if (!parsed) return "";
  const lines = parsed.raw.split(/\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s+/.test(line)) continue;
    const trimmed = line.trim();
    if (!trimmed.startsWith(`${key}:`)) continue;
    let value = trimmed.slice(trimmed.indexOf(":") + 1).trim();
    if (value === ">-" || value === "|" || value === ">") {
      const folded = [];
      for (let j = i + 1; j < lines.length; j += 1) {
        if (!/^\s+/.test(lines[j])) break;
        folded.push(lines[j].trim());
      }
      value = folded.join(" ");
    }
    return value.replace(/^["']|["']$/g, "");
  }
  return "";
}

function walkFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(file));
    else if (entry.isFile()) files.push(file);
  }
  return files;
}

for (const entry of registry.skills ?? []) {
  const skillFile = path.join(repoRoot, entry.path, "SKILL.md");
  if (!fs.existsSync(skillFile)) continue;
  ensureFrontmatter(skillFile, {
    type: "Skill",
    title: quoteYaml(titleize(entry.name)),
    resource: quoteYaml(`https://github.com/dirtybits/agent-skills/tree/main/${entry.path}`),
    tags: inlineList(entry.tags ?? []),
    timestamp: quoteYaml(now),
    okf_version: quoteYaml("0.1"),
    license: quoteYaml(entry.license ?? "all-rights-reserved"),
  });
}

for (const file of walkFiles(path.join(repoRoot, "skills"))) {
  const rel = path.relative(repoRoot, file).replaceAll(path.sep, "/");
  const base = path.basename(file);
  if (!rel.endsWith(".md")) continue;
  if (base === "SKILL.md" || base === "index.md" || base === "log.md") continue;
  if (!rel.includes("/references/") && !rel.endsWith("/reference.md")) continue;
  const skillName = rel.split("/")[1];
  const entry = registry.skills?.find((candidate) => candidate.name === skillName);
  ensureFrontmatter(file, {
    type: "Reference",
    title: quoteYaml(`${titleize(skillName)} ${titleize(path.basename(file, ".md"))}`),
    description: quoteYaml(`Reference material for the ${titleize(skillName)} skill.`),
    resource: quoteYaml(`https://github.com/dirtybits/agent-skills/blob/main/${rel}`),
    tags: inlineList([...(entry?.tags ?? []), "reference"]),
    timestamp: quoteYaml(now),
    okf_version: quoteYaml("0.1"),
  });
}

const skillEntries = [...(registry.skills ?? [])].sort((a, b) => a.name.localeCompare(b.name));
const skillsIndex = [
  "# Skills",
  "",
  "Generated directory index for AgentVouch skill packages.",
  "",
  ...skillEntries.map((entry) => {
    const skillFile = path.join(repoRoot, entry.path, "SKILL.md");
    const title = frontmatterValue(skillFile, "title") || titleize(entry.name);
    const summary = frontmatterValue(skillFile, "description");
    return `* [${title}](${entry.name}/SKILL.md) - ${summary}`;
  }),
  "",
].join("\n");
fs.writeFileSync(path.join(repoRoot, "skills", "index.md"), skillsIndex, "utf8");

const rootIndex = [
  "---",
  "okf_version: \"0.1\"",
  "type: Index",
  "title: Agent Skills Knowledge Bundle",
  "description: OKF-inspired index for dirtybits AgentVouch skill packages.",
  `timestamp: ${quoteYaml(now)}`,
  "---",
  "",
  "# Agent Skills Knowledge Bundle",
  "",
  "This repository is an OKF-inspired knowledge bundle for AgentVouch and local agent skills.",
  "",
  "# Sections",
  "",
  "* [Skills](skills/) - Skill packages and supporting reference material.",
  "* [Knowledge Base Conventions](KB_CONVENTIONS.md) - Repo conventions for OKF-inspired Markdown concepts.",
  "* [Update Log](log.md) - Semantic history of knowledge-base changes.",
  "",
].join("\n");
fs.writeFileSync(path.join(repoRoot, "index.md"), rootIndex, "utf8");

for (const entry of skillEntries) {
  const skillDir = path.join(repoRoot, entry.path);
  const skillTitle = titleize(entry.name);
  const lines = [
    `# ${skillTitle}`,
    "",
    `* [Skill definition](SKILL.md) - Main ${skillTitle} skill entrypoint.`,
  ];
  if (fs.existsSync(path.join(skillDir, "references"))) lines.push("* [References](references/) - Supporting guidance and patterns.");
  if (fs.existsSync(path.join(skillDir, "LICENSE.txt"))) lines.push("* [License](LICENSE.txt) - Skill-specific license terms.");
  lines.push("");
  fs.writeFileSync(path.join(skillDir, "index.md"), lines.join("\n"), "utf8");
}

console.log(`applied OKF conventions to ${skillEntries.length} skills`);
