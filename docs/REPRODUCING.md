# Reproducing the experiment

This is the same React Native CLI app used for the examples in the presentation "Saving Tokens in (Pet) Projects". The data comes from source code, CLI output, an HTTP response from a demo API, and actual build logs. No synthetic files containing random text are used.

## 1. Clone and verify the archive

```sh
git clone https://github.com/Suteki/rn-token-lab.git
cd rn-token-lab
nvm install
nvm use
npm --prefix benchmarks ci
npm run bench:verify
```

This mode requires no Xcode, Android SDK, RTK, API keys or LLM calls. It recounts both tokenizers for all 24 before/after pairs and checks the SHA-256 hashes of the public text. One pair intentionally fails its completeness check: RTK 0.40.0 omitted intent-to-add paths. This is a preserved counterexample, not a failure of `bench:verify`.

If you do not use `nvm`, install Node 26.0.0 another way. The reference run used macOS arm64; CI checks the app and public archive on Linux. Installing npm packages requires network access and runs their install scripts.

## 2. Run the app and repeat the filtering

Install RTK, ripgrep and jq from trusted sources. Original run versions: RTK **0.40.0**, ripgrep **15.1.0**, jq **1.8.1**. ast-grep 0.51.1, Repomix 1.19.0 and js-tiktoken 1.0.21 are pinned in the benchmark lockfile.

For RTK, if Rust/Cargo is installed:

```sh
cargo install --git https://github.com/rtk-ai/rtk --tag v0.40.0 --locked
```

Newer RTK versions may have different command names, output formats and bug fixes. `bench:doctor` reports local versions without changing the system. This project does not install global RTK hooks automatically.

```sh
rtk proxy npm ci
rtk proxy npm --prefix benchmarks ci
rtk proxy npm run bench:doctor
rtk proxy npm run check
rtk proxy npm run bench:all
```

`check` runs TypeScript, ESLint and 40 Jest tests. `bench:all` runs 22 core comparisons and adds two replays of successful native build logs. Output: `benchmarks/results/benchmarks.json`, `benchmarks.csv`, `RESULTS.md`, and `cases/`. Git ignores these files. Running the benchmark does not overwrite the archive in `benchmarks/snapshots/2026-11-09/`.

Source types:

| Source | What happens in a new run |
| --- | --- |
| TS/TSX, XML, Podfile, lockfile, configuration | Reads the current code within an explicit scope |
| Autolinking | Runs React Native config again |
| Jest | Runs the tests again and derives both representations from one result |
| Git status / diff | Recreates the real RN change set from baseline `1bac4f5` in a temporary Git repository; the working clone is unchanged |
| Git intent-to-add | Replays the preserved pair showing the RTK 0.40.0 bug; this is a historical check, not a claim about newer versions |
| JSONPlaceholder API | Uses a captured real response by default; `BENCH_LIVE_API=1` enables a new HTTP request |
| Initial TypeScript / Xcode errors | Replays historical failures that have been fixed in the current code |
| Successful iOS / Android build logs | Replays captured builds unless you have created fresh native captures |

To check a command manually, inspect the case's `beforeCommand` / `afterCommand`. Some labels in the historical archive describe the original run; current executable commands are in the scripts and newly generated results JSON.

## 3. Capture your own native builds

For iOS, you need Xcode and CocoaPods. For Android, you need JDK 17 and the Android SDK versions specified in the Gradle configuration. Set your own `ANDROID_HOME` or `android/local.properties`. Local SDK paths are not committed. Also check Java 17 and SDK setup against the [RN documentation](https://reactnative.dev/docs/set-up-your-environment).

```sh
rtk proxy npm run check
rtk proxy npm run native:pods
rtk proxy npm run native:ios
rtk proxy npm run native:android
rtk proxy npm run native:metro
rtk proxy npm run bench:all
```

The scripts store stdout, stderr, exit codes and duration in `benchmarks/results/native/`. If your own iOS capture exists there, the final step expects the complete pods/ios/android/metro set and checks. Successful compilation does not establish UI scenario coverage.

Launch the interface:

```sh
rtk proxy npm start
# In another terminal:
rtk proxy npm run ios
# Or:
rtk proxy npm run android
```

The app reads public demo tasks; local drafts and favorites stay on the device. The UI may need access to JSONPlaceholder. The benchmark does not require access to that API by default.

## What is reproduced

The original presentation figures are stored in `snapshots/2026-11-09/benchmarks.json`. Before publication, personal absolute paths in logs were replaced with `/workspace/rn-token-lab` and `/home/demo`. This affects tokenization. Therefore:

- `benchmarks.json` preserves the **original measured counts** used in the slides;
- `published-counts.json` contains **exact counts for the published text** in both tokenizers;
- `redaction-manifest.json` records original and published SHA-256 hashes, path redaction and subsequent English translations of report/task metadata;
- `bench:verify` checks the public archive; `bench:all` creates your own new measurement.

The English translation changes report wording, task descriptions and a documentation anchor, without changing captured inputs, outputs, numeric measurements or completeness checks. The manifest retains original hashes and records the updated published hashes.

New absolute paths, Git state, OS versions, tool versions and timings can change results. Do not expect a new live run to match the original slides exactly.

We count complete text outputs with `o200k_base` and `cl100k_base`, not provider usage. These are not actual Claude/Codex charges, subscription quota or whole-session savings. AST/Repomix checks verify the symbols/paths needed for a task; they do not prove full semantic equivalence. Debugging requires the originals. Unfavorable cases remain in the archive.

## Agent rules

Short shared rules live in `AGENTS.md`. Claude imports them through `@AGENTS.md` in `CLAUDE.md`. Tool configuration and safe setup examples: [AGENT-SETUP.md](AGENT-SETUP.md). A Markdown instruction does not install a CLI, create an MCP server or grant permissions. Keep personal settings and API keys out of Git.

## English prompt wording: a separate local example

`npm --prefix benchmarks run prompt:sample` counts three RN tasks expressed as concise and expanded English prompts, plus an identical CLI command as a control. Both variants request the same information. This is a text count with two tokenizers, without model calls or a test of answer quality or whole-session savings.

This English-only example replaces the earlier English/Ukrainian sample. It does not reproduce the presentation's historical language comparison or support a universal language-cost multiplier. The original 24 CLI-text pairs and local-model results are unaffected.

## Additional Appendix examples

`docs/examples/rn-reader.md` is a Claude subagent example; after review, copy it to `.claude/agents/rn-reader.md` if needed. It is not activated automatically. `docs/examples/claude-cache.settings.json` is a fragment to merge into an existing `.claude/settings.json`, not a replacement for the entire file. `promptCacheTtl` requires Claude Code v2.1.242+; 1h cache writes cost more than 5m and are not always more economical. For Codex, check available models/effort through `/model` and `/status`. Do not treat OpenAI API TTL as a Codex client setting.
