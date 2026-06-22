import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const skillsRoot = path.join(repoRoot, "skills");
const registryPath = path.join(repoRoot, "registry.json");
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function stripQuotes(value) {
  const trimmed = String(value ?? "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(file) {
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    throw new Error("missing YAML frontmatter");
  }

  const lines = match[1].split(/\n/);
  const frontmatter = {};
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s+/.test(line)) continue;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf(":");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if (value === ">-" || value === "|" || value === ">") {
      const folded = [];
      for (let j = i + 1; j < lines.length; j += 1) {
        const next = lines[j];
        if (!/^\s+/.test(next)) break;
        folded.push(next.trim());
        i = j;
      }
      value = folded.join(" ").trim();
    }

    frontmatter[key] = value;
  }
  return { frontmatter, body: text.slice(match[0].length), text };
}

function parseYamlList(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return [];
  return inner
    .split(",")
    .map((item) => stripQuotes(item.trim()))
    .filter(Boolean);
}

function walkFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(file));
    } else if (entry.isFile()) {
      files.push(file);
    }
  }
  return files;
}

function relative(file) {
  return path.relative(repoRoot, file).replaceAll(path.sep, "/");
}

function isConceptDoc(file) {
  const rel = relative(file);
  const base = path.basename(file);
  if (!rel.endsWith(".md")) return false;
  if (base === "index.md" || base === "log.md") return false;
  if (rel === "KB_CONVENTIONS.md") return true;
  if (/^skills\/[^/]+\/SKILL\.md$/.test(rel)) return true;
  if (/^skills\/[^/]+\/reference\.md$/.test(rel)) return true;
  if (/^skills\/[^/]+\/references\/.*\.md$/.test(rel)) return true;
  return false;
}

function validateConcept(file) {
  const rel = relative(file);
  let parsed;
  try {
    parsed = parseFrontmatter(file);
  } catch (error) {
    fail(`${rel}: ${error.message}`);
    return null;
  }
  const { frontmatter } = parsed;
  if (!stripQuotes(frontmatter.type)) fail(`${rel}: missing required OKF frontmatter field 'type'`);
  if (!stripQuotes(frontmatter.title) && !stripQuotes(frontmatter.name)) {
    fail(`${rel}: missing frontmatter title or name`);
  }
  if (!stripQuotes(frontmatter.description)) fail(`${rel}: missing frontmatter description`);
  if (frontmatter.tags !== undefined && parseYamlList(frontmatter.tags) === null) {
    fail(`${rel}: tags must be an inline YAML list, e.g. [foo, bar]`);
  }
  if (frontmatter.timestamp !== undefined && !ISO_8601.test(stripQuotes(frontmatter.timestamp))) {
    fail(`${rel}: timestamp must be ISO 8601 UTC, e.g. 2026-06-22T19:13:38Z`);
  }
  return parsed;
}

function validateMarkdownLinks(file) {
  const rel = relative(file);
  const text = fs.readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  const linkPattern = /(?<!!)\[[^\]\n]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of text.matchAll(linkPattern)) {
    const target = match[1];
    if (/^(https?:|mailto:|tel:|#)/i.test(target)) continue;
    const withoutAnchor = target.split("#")[0];
    if (!withoutAnchor) continue;
    const resolved = withoutAnchor.startsWith("/")
      ? path.join(repoRoot, withoutAnchor.slice(1))
      : path.resolve(path.dirname(file), withoutAnchor);
    if (!fs.existsSync(resolved)) {
      fail(`${rel}: broken internal link -> ${target}`);
    }
  }
}

function validateIndex(file) {
  const rel = relative(file);
  const text = fs.readFileSync(file, "utf8");
  if (rel !== "index.md" && text.startsWith("---\n")) {
    fail(`${rel}: reserved index.md should not include frontmatter except at bundle root`);
  }
  const body = text.replace(/^---\n[\s\S]*?\n---\n?/, "").trimStart();
  if (!/^#\s+/.test(body)) {
    fail(`${rel}: index.md should begin with a heading`);
  }
}

function validateLog(file) {
  const rel = relative(file);
  const text = fs.readFileSync(file, "utf8");
  if (!text.startsWith("# ")) fail(`${rel}: log.md should begin with a top-level heading`);
  for (const heading of text.matchAll(/^##\s+(.+)$/gm)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(heading[1].trim())) {
      fail(`${rel}: log date heading must use YYYY-MM-DD: ${heading[1]}`);
    }
  }
}

const registry = readJson(registryPath);
const registryByName = new Map();
for (const entry of registry.skills ?? []) {
  if (registryByName.has(entry.name)) {
    fail(`duplicate registry skill: ${entry.name}`);
  }
  registryByName.set(entry.name, entry);
}

const seenNames = new Set();
for (const dirent of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
  if (!dirent.isDirectory()) continue;
  const skillDir = path.join(skillsRoot, dirent.name);
  const skillFile = path.join(skillDir, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    fail(`${dirent.name}: missing SKILL.md`);
    continue;
  }

  const parsed = validateConcept(skillFile);
  if (!parsed) continue;
  const frontmatter = parsed.frontmatter;
  const name = stripQuotes(frontmatter.name);
  const description = stripQuotes(frontmatter.description);
  const type = stripQuotes(frontmatter.type);

  if (type !== "Skill") fail(`${dirent.name}: SKILL.md type should be Skill`);
  if (!name || !/^[a-z0-9-]+$/.test(name)) fail(`${dirent.name}: invalid frontmatter name`);
  if (name !== dirent.name) fail(`${dirent.name}: frontmatter name '${name}' must match directory`);
  if (!description) fail(`${dirent.name}: missing frontmatter description`);
  if (seenNames.has(name)) fail(`${dirent.name}: duplicate skill name`);
  seenNames.add(name);

  const registryEntry = registryByName.get(name);
  if (!registryEntry) {
    fail(`${dirent.name}: missing registry entry`);
  } else {
    if (registryEntry.path !== `skills/${dirent.name}`) fail(`${dirent.name}: registry path mismatch`);
    const registryTags = registryEntry.tags ?? [];
    const fmTags = parseYamlList(frontmatter.tags) ?? [];
    for (const tag of registryTags) {
      if (!fmTags.includes(tag)) fail(`${dirent.name}: frontmatter tags missing registry tag '${tag}'`);
    }
    if (registryEntry.license && frontmatter.license && stripQuotes(frontmatter.license) !== registryEntry.license) {
      fail(`${dirent.name}: registry license does not match frontmatter license`);
    }
  }

  for (const file of walkFiles(skillDir)) {
    const mode = fs.statSync(file).mode;
    if ((mode & 0o111) !== 0) fail(`${relative(file)}: executable bit is not allowed`);
  }
}

for (const name of registryByName.keys()) {
  if (!seenNames.has(name)) fail(`${name}: registry entry has no matching skill directory`);
}

for (const file of walkFiles(repoRoot)) {
  const rel = relative(file);
  if (rel.startsWith(".git/")) continue;
  if (isConceptDoc(file)) validateConcept(file);
  if (rel.endsWith("index.md")) validateIndex(file);
  if (rel.endsWith("log.md")) validateLog(file);
  if (rel.endsWith(".md")) validateMarkdownLinks(file);
}

if (process.exitCode) process.exit(process.exitCode);
console.log(`validated ${seenNames.size} skills with OKF-style KB checks`);
