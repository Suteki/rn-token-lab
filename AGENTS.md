# TokenSavingsRN

- Prefix shell commands with `rtk`. Use a dedicated RTK wrapper when supported; use `rtk proxy <command>` when exact raw output is needed or no wrapper exists.
- Find candidate source files with `rtk proxy rg -l '<pattern>' src`; then read matching lines with `rtk proxy rg -n -C 3 '<pattern>' <file>`. Keep the scope narrow and expand it when results are incomplete.
- For native-module names and platforms, run `rtk proxy node tools/agent-autolinks.mjs`. The stored jq filter is `tools/jq/autolink.jq`.
- For navigation call sites, use `rtk proxy benchmarks/node_modules/.bin/ast-grep scan --filter rn-navigation-call src/screens --color never`. Rules live in `tools/ast-rules/`, registered in `sgconfig.yml`. Search first; review a diff before applying rewrites.
- For an app structure overview, run `rtk proxy benchmarks/node_modules/.bin/repomix --config repomix.config.json`. Read original source before changing implementation. Inspect the generated `.agent-context/app.xml` before sharing it.
- Treat ignore patterns and secret scanners as filters, not access controls. Do not print credentials, environment values or private keys. Keep sandbox and permission controls enabled.
- For change completeness, use raw `rtk proxy git status --porcelain` and a scoped raw diff. The frozen RTK 0.40.0 intent-to-add capture omitted 15 paths.
- Keep full logs locally; report relevant errors and the producer's exit code. Run checks appropriate to the code change. Benchmark captures in `benchmarks/results/` describe a dated experiment; do not regenerate them during routine edits.
- Read `docs/AGENT-SETUP.md` on demand when setting up tools. Keep these always-loaded rules short.
