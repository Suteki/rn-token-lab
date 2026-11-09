# Additional tools: scope, setup and evidence

The original five-tool benchmark remains unchanged. The additional tools below use different mechanisms and cannot share one savings percentage. TOON has four local RN format comparisons; the others have source analysis and explicitly attributed upstream figures, not local RN agent A/B results.

## TOON 4.4.0: measured on this project

```sh
npm --prefix benchmarks ci
npm --prefix benchmarks/format-tools ci --ignore-scripts
npm --prefix benchmarks run verify:formats
npm --prefix benchmarks run bench:formats
rtk proxy node tools/agent-autolinks-toon.mjs
```

The optional package is isolated from app dependencies. The wrapper calls the existing checked RN-config/jq wrapper, then encodes its eight module records locally. For Claude Code and Codex, the same shell command works. An optional rule in `AGENTS.md` can say: `For native module names and platforms, use node tools/agent-autolinks-toon.mjs; request the full JSON entry when more metadata is needed.` Claude can import that rule through `CLAUDE.md`.

Frozen inputs, three output formats, hashes and counts: [format results](../benchmarks/snapshots/2026-11-09/formats/RESULTS.md). All 12 decode round trips reproduce the same JSON values. Complete strings are counted with o200k_base and cl100k_base. Formatting instructions, tool protocol, model answers, cache, billing and task quality are not measured.

Relative to compact JSON, native modules use 130 versus 82 o200k_base tokens; 20 tasks use 467 versus 314; 18 direct dependencies use 276 versus 227. Full nested RN config grows from 5,159 to 5,423. Use TOON for uniform records, and keep JSON when it is smaller or required by the consumer. Encoding preserves secrets as faithfully as other fields: it is not redaction or an access control.

Source: [TOON](https://github.com/toon-format/toon).

## Context Mode: local execution and retrieval

The plugin keeps full tool output in a local project index and returns selected results through `ctx_execute`, `ctx_index` and `ctx_search`. It can help with large RN build logs; startup, retrieval calls and missing details can outweigh savings on short outputs. Upstream's 99.4% refers to output bytes in a selected large-output benchmark, not billed tokens or our RN run.

Official Claude Code setup uses its plugin marketplace. Codex setup currently uses its plugin marketplace plus a separate trusted hook setup. Review the release and changed files before following these commands; the documentation reviewed alongside npm 2.1.7 can describe release-branch behavior that differs from another installed version:

```sh
# Claude Code
claude plugin marketplace add mksglu/context-mode
claude plugin install context-mode@context-mode
# Codex
codex plugin marketplace add mksglu/context-mode
codex plugin add context-mode@context-mode
# Optional Codex hook setup after reviewing the pinned package:
npm install -g context-mode@2.1.7
context-mode setup --agents codex
```

Keep task rules in `AGENTS.md` / imported `CLAUDE.md`; plugin installation, MCP connections and hook trust remain separate. Verify the actual `ctx_*` calls rather than assuming that a Markdown rule activates them. The local index lives under `~/.context-mode`; use `ctx_purge` for the appropriate session/source/project when needed. Retain host permissions and OS isolation: the tool's subprocess sandbox is not an OS security boundary. The hosted Gateway is a separate data flow and approval decision.

Sources: [repository](https://github.com/mksglu/context-mode), [security](https://contextmode.ai/docs/engine/security).

## Serena: semantic code access through MCP

Serena retrieves symbols and references through a language server or a separate JetBrains backend. It can be useful for RN TypeScript symbol investigation, while a small literal search may need only ripgrep. Indexing/startup and extra tool descriptions also cost time/context. There is no local RN savings percentage here.

After installing and reviewing a pinned Serena release, use its MCP launch command. For Claude Code, a project-specific example from the RN root is:

```sh
claude mcp add serena -- serena start-mcp-server --context claude-code --project-from-cwd
```

For Codex, merge the following into `~/.codex/config.toml`, or a trusted project's `.codex/config.toml` if that scope is approved. Use the installed executable's absolute path if necessary:

```toml
[mcp_servers.serena]
startup_timeout_sec = 15
command = "serena"
args = ["start-mcp-server", "--project-from-cwd", "--context=codex"]
```

The Codex app may start MCP outside the project directory, so explicitly activate and verify the intended project before querying symbols. A rule in `AGENTS.md` / imported `CLAUDE.md` can request symbol lookup before whole-file reading. Start with investigation; review the enabled tools separately before allowing edits or shell execution. Project selection is not an OS sandbox. Keep node_modules/build output outside the index, check logs and protect the dashboard/network binding.

Sources: [clients](https://oraios.github.io/serena/02-usage/030_clients.html), [security](https://oraios.github.io/serena/02-usage/070_security.html).

## Caveman: distinguish the response skill from the full CLI

The response skill changes prose style. Its instruction text adds input and does not itself compress model reasoning. Historical 3% and 8.5% output figures use different evaluations; they do not prove whole-session savings.

The current 4.x CLI additionally offers input compression, model/effort routing, reusable scripts and other modules. Upstream's 33.2% input and 54% cost claims refer to separate experiments, not this RN app. Review those denominators before using a number. Do not add the percentages.

For a style-only pilot, review the skill at a pinned release and save only the intended instruction in `.claude/skills/caveman/SKILL.md` for Claude Code or `.agents/skills/caveman/SKILL.md` for Codex. Avoid copying an entire mutable repository into always-loaded instructions. A plain concise-answer rule in `AGENTS.md`, imported by `CLAUDE.md`, is a useful control.

If separately testing the full CLI, inspect `caveman status`; check and disable unwanted modules before starting agent traffic. Current controls include `caveman telemetry off`, `caveman off waste-fixes`, and `CAVEMAN_CACHE_WARM=off`. The cache-warming module can repeat authenticated Anthropic requests while the user pauses. It needs its own cost and data-flow review. The local proxy handles request content and provider credentials; managed cloud is a separate external service. No global Caveman settings were installed by this experiment.

Sources: [honest numbers](https://github.com/JuliusBrussee/caveman/blob/main/docs/HONEST-NUMBERS.md), [install](https://github.com/JuliusBrussee/caveman/blob/main/INSTALL.md), [security](https://github.com/JuliusBrussee/caveman/blob/main/SECURITY.md), [Codex skills](https://learn.chatgpt.com/docs/build-skills).

## Headroom: library, proxy and MCP

Headroom compresses selected message content and can keep recoverable originals. Its upstream four-case proof reports 21–57% fewer input tokens; those are vendor scenarios, not RN results or a guarantee of net task cost. Benefits are plausible for repetitive data; dense prose, retrieval, cache misses and quality failures require separate measurement.

After a reviewed installation, documented agent entry points include `headroom wrap claude` and `headroom wrap codex`. Current documentation describes session-scoped wrapping, but review the actual release and configuration diff, with `headroom unwrap <tool>` as the documented reversal. Do not change global provider endpoints merely by adding an `AGENTS.md` rule. The rule can describe when to retrieve an original, while runtime routing belongs in the reviewed agent/proxy setup.

For a library-only offline test, the documented `HEADROOM_OFFLINE=1` setting avoids network activity for compression. A proxy still forwards traffic to the selected model provider and handles credentials. Bind locally, protect stored originals and logs, review plugin paths and permissions, and compare provider cache counters and successful-task cost before adopting it. No Headroom proxy was connected to user credentials in this experiment.

Sources: [proof and integration](https://github.com/headroomlabs-ai/headroom), [proxy](https://docs.headroomlabs.ai/docs/proxy).
