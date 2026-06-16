import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const skillsRoot = path.join(repoRoot, "skills");
const registryPath = path.join(repoRoot, "registry.json");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function parseFrontmatter(skillPath) {
  const text = fs.readFileSync(skillPath, "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    throw new Error("missing YAML frontmatter");
  }

  const frontmatter = {};
  for (const line of match[1].split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf(":");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }
  return frontmatter;
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

  let frontmatter;
  try {
    frontmatter = parseFrontmatter(skillFile);
  } catch (error) {
    fail(`${dirent.name}: ${error.message}`);
    continue;
  }

  const name = frontmatter.name;
  const description = frontmatter.description;
  if (!name || !/^[a-z0-9-]+$/.test(name)) {
    fail(`${dirent.name}: invalid frontmatter name`);
  }
  if (name !== dirent.name) {
    fail(`${dirent.name}: frontmatter name '${name}' must match directory`);
  }
  if (!description) {
    fail(`${dirent.name}: missing frontmatter description`);
  }
  if (seenNames.has(name)) {
    fail(`${dirent.name}: duplicate skill name`);
  }
  seenNames.add(name);

  const registryEntry = registryByName.get(name);
  if (!registryEntry) {
    fail(`${dirent.name}: missing registry entry`);
  } else if (registryEntry.path !== `skills/${dirent.name}`) {
    fail(`${dirent.name}: registry path mismatch`);
  }

  for (const file of walkFiles(skillDir)) {
    const mode = fs.statSync(file).mode;
    if ((mode & 0o111) !== 0) {
      fail(`${path.relative(repoRoot, file)}: executable bit is not allowed`);
    }
  }
}

for (const name of registryByName.keys()) {
  if (!seenNames.has(name)) {
    fail(`${name}: registry entry has no matching skill directory`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log(`validated ${seenNames.size} skills`);
