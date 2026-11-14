---
name: principles
description: "Use to find and read, by name, one of pstack's 24 engineering principles (such as fix-root-causes or prove-it-works) or its unslop writing method, bundled in this plugin. Lists each name with when it applies and its file."
---

# Updraft: principles

pstack's 24 engineering principles and its unslop writing method ship in this plugin as
skills. Neither host lists them to the model, so find them here. Read a file at its path below, relative to this skill's
directory: Claude Code shows that directory as "Base directory for this skill", and Codex
lists this file's path. A user can also invoke one by its skill name, the directory in its
path, such as `/updraft:principle-fix-root-causes` in Claude Code.

| Name | When it applies | File |
| --- | --- | --- |
| attack-the-premise | Two fixes sharing a premise fail the same gate, or a review round's blockers all land in code the previous fix added; test that premise before another fix. | `../principle-attack-the-premise/SKILL.md` |
| boundary-discipline | Validation, error handling or adapters; guard boundaries and keep business logic pure. | `../principle-boundary-discipline/SKILL.md` |
| build-the-lever | Nontrivial work; build the smallest rerunnable tool that does or proves it. | `../principle-build-the-lever/SKILL.md` |
| encode-lessons-in-structure | Writing the same instruction a second time or noticing a recurring correction; encode the rule as a lint, metadata flag, runtime check or script. | `../principle-encode-lessons-in-structure/SKILL.md` |
| exhaust-the-design-space | Novel interactions or architectural decisions without precedent; compare competing prototypes. | `../principle-exhaust-the-design-space/SKILL.md` |
| experience-first | Product, UX or scope tradeoffs; choose user delight over implementation convenience. | `../principle-experience-first/SKILL.md` |
| explain-the-number | Before measuring or trusting a measured number; identify its limit and rule out confounders. | `../principle-explain-the-number/SKILL.md` |
| fix-root-causes | Debugging; fix the first wrong state, using guards only for legitimate states. | `../principle-fix-root-causes/SKILL.md` |
| foundational-thinking | Before logic, choose core types, data structures, scaffolding order and shared state. | `../principle-foundational-thinking/SKILL.md` |
| guard-the-context-window | Large outputs, long files or repeated reads; keep summaries. | `../principle-guard-the-context-window/SKILL.md` |
| laziness-protocol | Refactoring, sizing a diff or considering abstractions; prefer deletion and the smallest solution. | `../principle-laziness-protocol/SKILL.md` |
| make-operations-idempotent | Commands, lifecycle steps or retrying loops; converge after crashes and retries. | `../principle-make-operations-idempotent/SKILL.md` |
| migrate-callers-then-delete-legacy-apis | Replacing an internal API; migrate callers and delete the old API in one wave. | `../principle-migrate-callers-then-delete-legacy-apis/SKILL.md` |
| minimize-reader-load | Shaping or reviewing hard-to-trace code; reduce layers and hidden state. | `../principle-minimize-reader-load/SKILL.md` |
| model-the-domain | Stateful or branching logic and repeated shape assumptions; encode the domain in a structure. | `../principle-model-the-domain/SKILL.md` |
| never-block-on-the-human | Tempted to ask "should I do X?" on reversible work; proceed and let the human course-correct. | `../principle-never-block-on-the-human/SKILL.md` |
| outcome-oriented-execution | Phased rewrites or migrations; converge on the target without throwaway compatibility states. | `../principle-outcome-oriented-execution/SKILL.md` |
| prove-it-works | After a task and before declaring done; verify the real artifact. | `../principle-prove-it-works/SKILL.md` |
| redesign-from-first-principles | Integrating a requirement; design as if it had been foundational. | `../principle-redesign-from-first-principles/SKILL.md` |
| separate-before-serializing-shared-state | Concurrent actors write the same target; remove sharing first. | `../principle-separate-before-serializing-shared-state/SKILL.md` |
| sequence-verifiable-units | Sweeps, migrations or multi-step work; verify each small unit before the next. | `../principle-sequence-verifiable-units/SKILL.md` |
| subtract-before-you-add | Adding, refactoring or rewriting; remove dead weight first. | `../principle-subtract-before-you-add/SKILL.md` |
| test-behavior-not-implementation | Writing, changing or retaining tests; assert observable behavior. | `../principle-test-behavior-not-implementation/SKILL.md` |
| type-system-discipline | Types or signatures; make illegal states unrepresentable and parse external data. | `../principle-type-system-discipline/SKILL.md` |
| unslop | Writing or editing any prose; cut AI tells. | `../unslop/SKILL.md` |
