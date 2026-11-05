// updraft's OpenCode plugin. Its config hook adds package.json's `skills` folders to OpenCode's
// skill paths, each skill as the command /updraft:<skill>, and each dispatchable reviewer in
// agents/ as the subagent updraft:<name>, the names the skills dispatch on Claude Code. A skill
// with `disable-model-invocation: true` is denied to the skill tool, as on Claude Code and Codex.
// What the user's config already sets for any of these wins.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// A Markdown file's frontmatter (top-level `key: value` lines: plain, a JSON-quoted string, or
// a `>`/`|` block scalar) and its body.
function split(text) {
  const end = text.startsWith("---\n") ? text.indexOf("\n---\n", 3) : -1;
  if (end < 0) return [{}, text];
  const head = {};
  const lines = text.slice(4, end).split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = /^([\w-]+):\s*(.*)$/.exec(lines[i]);
    if (!match) continue;
    const [, key, value] = match;
    if (/^[>|]-?$/.test(value)) {
      const block = [];
      while (i + 1 < lines.length && /^(\s|$)/.test(lines[i + 1])) block.push(lines[++i].trim());
      head[key] = value.startsWith(">") ? block.filter(Boolean).join(" ") : block.join("\n").trim();
    } else if (value.startsWith('"')) {
      try {
        head[key] = JSON.parse(value);
      } catch {
        head[key] = value;
      }
    } else {
      head[key] = value;
    }
  }
  return [head, text.slice(end + 5).replace(/^\n+/, "")];
}

function skills() {
  const { skills: dirs = [] } = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const found = [];
  for (const dir of dirs) {
    const base = path.resolve(ROOT, dir);
    for (const entry of readdirSync(base).sort()) {
      const file = path.join(base, entry, "SKILL.md");
      if (!existsSync(file)) continue;
      const [head, body] = split(readFileSync(file, "utf8"));
      found.push({ base, name: head.name || entry, head, body, dir: path.join(base, entry) });
    }
  }
  return found;
}

// Claude Code tool names that grant each OpenCode permission a reviewer's `tools` list can withhold.
const GRANTS = {
  edit: ["Edit", "Write", "MultiEdit", "NotebookEdit"],
  task: ["Agent", "Task"],
  webfetch: ["WebFetch"],
};

// agents/*.md with a `phase`: reviewer-contract, an authoring template, has none.
function agents() {
  const base = path.join(ROOT, "agents");
  const found = {};
  if (!existsSync(base)) return found;
  for (const entry of readdirSync(base).sort()) {
    if (!entry.endsWith(".md")) continue;
    const [head, body] = split(readFileSync(path.join(base, entry), "utf8"));
    if (!head.phase) continue;
    const agent = { description: head.description || "", mode: "subagent", prompt: body };
    if (head.tools) {
      const tools = head.tools.split(",").map((t) => t.trim());
      const permission = {};
      for (const [name, grants] of Object.entries(GRANTS)) {
        if (!grants.some((t) => tools.includes(t))) permission[name] = "deny";
      }
      agent.permission = permission;
    }
    if (/^\d+$/.test(head.maxTurns ?? "")) agent.steps = Number(head.maxTurns);
    found[`updraft:${head.name || entry.slice(0, -3)}`] = agent;
  }
  return found;
}

function addSkillPaths(config, dirs) {
  const add = (paths) => [...paths, ...dirs.filter((d) => !paths.includes(d))];
  if (Array.isArray(config.skills)) config.skills = add(config.skills);
  else config.skills = { ...config.skills, paths: add(config.skills?.paths ?? []) };
}

// Deny the skill tool each named skill the user's permission config leaves unset. A single
// action for every permission (`"permission": "allow"`) is the user's call and stays as it is.
function denySkills(config, names) {
  if (!names.length || typeof config.permission === "string") return;
  const permission = (config.permission ??= {});
  const rules = typeof permission.skill === "string" ? { "*": permission.skill } : { ...permission.skill };
  for (const name of names) rules[name] ??= "deny";
  permission.skill = rules;
}

export const Updraft = async () => {
  const found = skills();
  const commands = {};
  for (const skill of found) {
    commands[`updraft:${skill.name}`] = {
      description: skill.head.description || "",
      // The template OpenCode gives its own skill commands.
      template: [
        skill.body,
        "",
        `Base directory for this skill: ${skill.dir}`,
        "Relative paths in this skill (e.g., scripts/, references/) are relative to this base directory.",
      ].join("\n"),
    };
  }
  const subagents = agents();
  const dirs = [...new Set(found.map((s) => s.base))];
  const explicit = found.filter((s) => s.head["disable-model-invocation"] === "true").map((s) => s.name);
  return {
    config: async (config) => {
      if (dirs.length) addSkillPaths(config, dirs);
      config.command = { ...commands, ...config.command };
      config.agent = { ...subagents, ...config.agent };
      denySkills(config, explicit);
    },
  };
};
