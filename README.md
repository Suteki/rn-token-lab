# RN Token Lab

[Reproduction guide](docs/REPRODUCING.md) · [Frozen results](benchmarks/snapshots/2026-11-09/RESULTS.md) · [Agent setup](docs/AGENT-SETUP.md)

Public companion project for the talk "Saving Tokens in (Pet) Projects". This is the actual app used for the measurements, not a separate mock fixture.

```sh
git clone https://github.com/Suteki/rn-token-lab.git
cd rn-token-lab
nvm install
nvm use
npm --prefix benchmarks ci
npm run bench:verify
```

The quick start verifies all 24 published before/after pairs without Xcode, Android SDK, RTK or paid LLM calls. Install app dependencies and the external CLIs for a fresh benchmark run; see the reproduction guide. One historical intent-to-add case intentionally fails its task-completeness check.

## Local model: measured latency

[60 real local inference requests on Qwen3-Coder 30B / M5 Pro](benchmarks/snapshots/2026-11-09/local-model/RESULTS.md), including cache counters, TTFT, full time, token usage and incorrect answers. [Reproduce the local test](docs/LOCAL-MODEL.md). These results are separate from the original 24 CLI-text comparisons.

## App

A real React Native Community CLI app for comparing the text that coding agents read before and after local filtering. Created with React Native 0.88.1 and React 19.3.0. This repository contains the app, native projects, reproducible benchmark scripts, published before/after text and the measured results.

The app has a native stack with a task list, task details, a validated local task form and preferences. It reads 20 tasks from the public JSONPlaceholder demo API. Favorites and local drafts stay on the device. No personal data is posted to the demo API.

## Ten added projects

| Project | Installed version | Use in this app |
| --- | --- | --- |
| [React Navigation](https://reactnavigation.org/docs/getting-started/) | native 7.5.1, native-stack 7.21.0 | Four typed native screens |
| [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/) | 4.7.1 | Task card entry animation |
| [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) | 3.5.0 | Gesture root |
| [AsyncStorage](https://github.com/react-native-async-storage/async-storage) | 3.1.1 | Namespaced local preferences storage |
| [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/react-native) | 5.107.1 | Request state, cancellation and memory cache |
| [Zustand](https://github.com/pmndrs/zustand) | 5.1.0 | Favorites, drafts and persisted preferences |
| [React Hook Form](https://react-hook-form.com/get-started) | 7.91.0 | Controlled native task form |
| [Zod](https://zod.dev/) | 4.6.7 | HTTP response and form validation |
| [React Native SVG](https://github.com/software-mansion/react-native-svg) | 15.16.1 | Completion progress ring |
| [NetInfo](https://github.com/react-native-netinfo/react-native-netinfo) | 12.0.1 | Connectivity state and Query online manager |

Native support packages: Screens 4.30.1, Safe Area Context 5.11.1 and Worklets 0.13.1. `@hookform/resolvers` 7.0.5 connects the form to Zod. These supporting packages are additional to the ten projects above. The list is a practical selection, not a measured popularity ranking.

## Run the app

Use Node 22.13+, 24.3+ or 26 as required by RN 0.88.1. Versions are locked in `package-lock.json`.

```sh
rtk proxy npm ci
rtk proxy npm start
```

In another terminal:

```sh
rtk proxy npm run ios
# or
rtk proxy npm run android
```

For iOS, install Xcode and CocoaPods, then run `rtk proxy pod install --project-directory=ios`. For Android, point `ANDROID_HOME` or an untracked `android/local.properties` at your own SDK. The local SDK path used during this experiment is not part of the portable project configuration.

The Babel config includes `@babel/plugin-transform-export-namespace-from` for Zod's module syntax. Worklets remains the last plugin. The Podfile raises older resource-bundle deployment targets to the RN-supported minimum. Android activity restoration and predictive-back configuration follow the React Navigation setup guide.

## Checks and measurements

The project includes [Codex and Claude Code setup instructions](docs/AGENT-SETUP.md), a shared `AGENTS.md`, a `CLAUDE.md` import, and working configurations for ripgrep, jq, ast-grep and Repomix. Global hooks and personal settings are described for review rather than installed automatically.

```sh
rtk proxy npm run typecheck
rtk proxy npx eslint App.tsx src __tests__ --max-warnings 0
rtk proxy npm test -- --runInBand --verbose
rtk proxy npm --prefix benchmarks ci
rtk proxy npm run bench:doctor
rtk proxy npm run bench:all
```

The 40 Jest tests cover API validation, HTTP failures, cancellation, filters, favorites, local task creation and completion statistics. They do not claim simulator interaction or end-to-end UI coverage. Native checks and their actual exit codes are recorded separately under `benchmarks/results/native/`.

Benchmark tools are isolated in `benchmarks/node_modules`, so the app's dependency lockfile is not inflated by Repomix or the tokenizer. External CLI prerequisites: RTK, ripgrep and jq. Benchmark-local ast-grep, Repomix and js-tiktoken versions are pinned in `benchmarks/package-lock.json`.

Open [the frozen results report](benchmarks/snapshots/2026-11-09/RESULTS.md), [historical counts](benchmarks/snapshots/2026-11-09/benchmarks.json), [public-text counts](benchmarks/snapshots/2026-11-09/published-counts.json), or [CSV](benchmarks/snapshots/2026-11-09/benchmarks.csv). Published before/after text is in `benchmarks/snapshots/2026-11-09/cases/`. Fresh runs write ignored files under `benchmarks/results/`.

## Measurement boundaries

Every comparison starts with a stated question and a bounded source scope. The runner counts the entire text with `o200k_base` and cross-checks with `cl100k_base`. Both are common comparison units. They are not Claude's tokenizer and are not a promise of current Codex billing counts. No model calls or subscription quota measurements are made.

Jest and diagnostic replay cases feed one actual captured output to the filter, avoiding comparisons between a cold build and a warm build. Initial TypeScript/Xcode failures and a Git intent-to-add counterexample are preserved in `benchmarks/captures/`, with the fixed app source kept separately. These are real setup captures, not generated error messages. Successful current builds do not recreate those historical failures.

The suite keeps unfavorable results. Short TypeScript output can grow after grouping. Packaging mixed native/configuration files can add more metadata than it removes. The captured RTK compact-status output omitted intent-to-add files in the installed build, so that case fails its completeness check and is excluded from recommendations. Raw `git status --porcelain` remains the reference.

Do not add savings percentages from different questions. A compressed structural overview intentionally drops implementation and cannot replace the original source for debugging. Standalone stdin filters can return zero even when the producer failed. Use the normal RTK command wrapper or preserve the producer's exit status with your shell's `pipefail` setting.

## Original initialization

```sh
rtk proxy npx --yes @react-native-community/cli@20.2.0 init TokenSavingsRN \
  --version 0.88.1 --directory rn-token-lab --skip-install \
  --skip-git-init --install-pods false
```

The baseline scaffold and installed dependencies are in Git commit `1bac4f5`; the subsequent commit contains the integrated app and publication/reproduction setup. Regenerating results can change timings, paths and token counts. The presentation uses the original 9 November 2026 measurements. Personal path prefixes in published captures have been redacted: original measurements and public-text token counts are explicitly separated. See [the reproduction boundaries](docs/REPRODUCING.md#what-is-reproduced).

## License

Project code is published under [MIT](LICENSE). React Native and installed libraries retain their own licenses. Demo API data comes from [JSONPlaceholder](https://jsonplaceholder.typicode.com/). The npm package remains `private: true` to prevent accidental npm publication; the GitHub repository is public.
