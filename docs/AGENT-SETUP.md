# Tool setup for Codex and Claude Code

All paths below are relative to `rn-token-lab/` unless they start with `~/`. Configuration examples are already saved in this project. This project does not install or overwrite global user settings.

## Where to save configuration

| Purpose | File | Reader |
| --- | --- | --- |
| Short shared rules | `AGENTS.md` in the RN project root | Codex; Claude through the import below |
| Claude instructions | `CLAUDE.md` containing `@AGENTS.md` | Claude Code |
| Personal Codex rules | `~/.codex/AGENTS.md` | Codex across projects |
| Personal Claude rules | `~/.claude/CLAUDE.md` | Claude Code across projects |
| Team Claude hooks / settings | `.claude/settings.json` | Claude Code; commit after review |
| Personal Claude settings | `~/.claude/settings.json` or `.claude/settings.local.json` | Your user account; exclude the local file from Git |
| Codex runtime settings | `~/.codex/config.toml`; trusted projects may also use `.codex/config.toml` | Codex; separate from text instructions |
| Search exclusions | `.rgignore` | ripgrep |
| JSON projection | `tools/jq/autolink.jq` | jq with `-f`; not loaded automatically |
| AST rules | `sgconfig.yml` and `tools/ast-rules/navigation.yml` | ast-grep scan |
| Structural bundle | `repomix.config.json` | Repomix; output `.agent-context/app.xml` |

Codex collects global and project instructions at startup. Within a directory, `AGENTS.override.md` takes precedence over `AGENTS.md`. After changes, check the rules in a new session with `rn-token-lab/` as the working directory.

Current Claude Code can also read `AGENTS.md` directly, but behavior depends on its version and the presence of `CLAUDE.md` higher in the directory tree. This example uses an explicit import so both agents receive the same rules. The import itself does not save tokens: imported text also occupies context. The detailed guide is not imported automatically.

## RTK: check the version first

Install RTK from its official repository / package and check `rtk --version`. The measurements used **0.40.0**.

```sh
rtk proxy rtk init --codex --dry-run -v
rtk proxy rtk init -g --dry-run -v
```

These commands only preview changes. For Codex, RTK 0.40.0 proposes `AGENTS.md` + `RTK.md`, without a Claude hook. Run without `--dry-run` after reviewing the proposed changes. This project's existing `AGENTS.md` already states the RTK rule explicitly; manual wrapper calls do not require another init.

For Claude, this version's global `rtk init -g` proposes `~/.claude/RTK.md`, an import in `~/.claude/CLAUDE.md` and a `PreToolUse` hook in `~/.claude/settings.json`. The installer must **merge** the hook into existing settings, rather than replace the entire JSON. Hook fragment for manual review:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{"type": "command", "command": "rtk hook claude"}]
    }]
  }
}
```

The existence of `rtk gain` does not prove the hook is enabled. Restart the agent, run one simple command and inspect the actual tool call and `rtk gain --history`. Newer RTK versions may integrate with Codex differently; check your own `rtk init --help` and `--dry-run`. For exact output in 0.40.0, use `rtk proxy`; newer documentation calls this command `rtk bypass`.

Do not add a broad `allow Bash(*)` rule to save tokens. Review the hook as executable code. RTK may store raw logs locally: consider their contents and retention.

## ripgrep

Install `ripgrep` through a trusted package manager and check `rtk proxy rg --version`. `.rgignore` lists dependencies, build directories and generated context. `AGENTS.md` specifies the order: find filenames first, then read matching lines with context.

```sh
rtk proxy rg -l 'createNativeStackNavigator' src
rtk proxy rg -n -C 3 'createNativeStackNavigator<' src/navigation
```

`.rgignore` does not prevent an agent from reading files directly. Add `--no-ignore` or `--hidden` only when needed. If results are incomplete, expand the scope explicitly.

## jq

Install `jq` through a trusted package manager. Load the filter with `-f tools/jq/autolink.jq`. The command in `AGENTS.md` runs a small Node wrapper that checks the RN config exit code before invoking jq, so producer failures cannot become successful empty projections.

```sh
rtk proxy node tools/agent-autolinks.mjs
```

Expect 8 native modules with `ios` / `android` flags. To debug one module, read its complete JSON entry. Do not use `eval` on JSON data.

## ast-grep

Version 0.51.1 is pinned in `benchmarks/package-lock.json`; install local tools with `rtk proxy npm --prefix benchmarks ci`. `sgconfig.yml` registers the rules directory; the YAML specifies a TSX pattern without a rewrite.

```sh
rtk proxy benchmarks/node_modules/.bin/ast-grep scan \
  --filter rn-navigation-call src/screens --color never
```

Expect 3 calls. The rule matches syntax; it does not resolve types / aliases. Do not add `--update-all` to a search instruction; review fixes in a separate diff.

## Repomix

Version 1.19.0 is also pinned in the local benchmark lockfile. `repomix.config.json` explicitly includes only `App.tsx` and `src/**/*`, with `output.compress: true` and secret scanning enabled.

```sh
rtk proxy benchmarks/node_modules/.bin/repomix --config repomix.config.json
```

The bundle is saved to `.agent-context/app.xml` and excluded from Git. Check its 14 paths and contents before sending it to a model. Secretlint can miss a secret; do not disable it with `--no-security-check`. Function implementations are removed, so fixing logic requires the original source.

## Verify that the agent follows the rules

1. Open a new session from `rn-token-lab/`. In Codex, ask for the active instruction files and the native-stack search command. In Claude, check `/memory` and `/context all`: `CLAUDE.md` should include the imported rules.
2. Ask the agent to find the native stack without reading the entire repository. Inspect the actual tool call: scope `src`, use `rg`, then read narrowly. An agent restating the rules does not prove it follows them.
3. Check 8 modules, 3 navigation calls and 14 paths in the structural bundle. Review `rtk gain --history`, raw status and exit codes.

Third-party repositories may contain malicious instruction files, hooks and package scripts. Review and sandboxing remain necessary. A Markdown instruction alone does not install a CLI, run a hook or grant access.

## Sources checked on 9 November 2026

- [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Codex configuration](https://learn.chatgpt.com/docs/config-file/config-advanced)
- [Claude memory and imports](https://code.claude.com/docs/en/memory)
- [Claude settings scopes](https://code.claude.com/docs/en/settings)
- [RTK integration](https://github.com/rtk-ai/rtk) and local `rtk init --help` / dry-run 0.40.0
- [ripgrep guide](https://raw.githubusercontent.com/BurntSushi/ripgrep/master/GUIDE.md)
- [jq manual](https://jqlang.org/manual/)
- [ast-grep project config](https://ast-grep.github.io/reference/sgconfig.html)
- [Repomix configuration](https://repomix.com/guide/configuration) and [security](https://repomix.com/guide/security)
