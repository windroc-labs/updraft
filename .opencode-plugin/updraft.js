// updraft's OpenCode plugin. Its config hook adds package.json's `skills` folders to OpenCode's
// skill paths, each skill as the command /updraft:<skill>, and each dispatchable reviewer in
// agents/ as the subagent updraft:<name>, the names the skills dispatch on Claude Code. A skill
// with `disable-model-invocation: true` is denied to the skill tool, as on Claude Code and Codex.
// What the user's config sets for these names wins; for an agent, field by field.
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

// Each OpenCode tool permission and the Claude Code tools that grant it. A reviewer's `tools`
// allowlist denies every permission none of its tools grants.
const GRANTS = {
  read: ["Read"],
  list: ["Read", "Glob", "LS"],
  glob: ["Glob"],
  grep: ["Grep"],
  bash: ["Bash"],
  edit: ["Edit", "Write", "MultiEdit", "NotebookEdit"],
  task: ["Agent", "Task"],
  todowrite: ["TodoWrite"],
  question: ["AskUserQuestion"],
  webfetch: ["WebFetch"],
  websearch: ["WebSearch"],
  lsp: ["LSP"],
  skill: ["Skill"],
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

// Each reviewer, with the user's settings for its name merged over it (`permission` key by key).
function addAgents(config, subagents) {
  const merged = { ...config.agent };
  for (const [name, ours] of Object.entries(subagents)) {
    const user = merged[name] ?? {};
    const agent = { ...ours, ...user };
    if (typeof user.permission === "object") agent.permission = { ...ours.permission, ...user.permission };
    merged[name] = agent;
  }
  config.agent = merged;
}

// Deny the skill tool each named skill the user's rules do not name. OpenCode applies the last
// matching rule, so the denies go right after the user's `*` (first without one) and the user's
// rules keep their order. A string is OpenCode's shorthand for `{"*": <action>}`.
function denySkills(config, names) {
  if (!names.length) return;
  const rules = (value) => (typeof value === "string" ? { "*": value } : { ...value });
  config.permission = rules(config.permission);
  const user = Object.entries(rules(config.permission.skill));
  const at = user.findIndex(([pattern]) => pattern === "*") + 1;
  const denies = names.filter((name) => !user.some(([pattern]) => pattern === name)).map((name) => [name, "deny"]);
  config.permission.skill = Object.fromEntries([...user.slice(0, at), ...denies, ...user.slice(at)]);
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
      addAgents(config, subagents);
      denySkills(config, explicit);
    },
  };
};
