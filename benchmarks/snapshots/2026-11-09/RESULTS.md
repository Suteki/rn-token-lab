# React Native token benchmark

**Historical measurements before path redaction.** Personal absolute path prefixes have been replaced in public captures. Original counts below match the dated slides; exact reproducible counts for the public text are in [published-counts.json](published-counts.json). Run `npm run bench:verify` from the repository root. See [reproduction boundaries](../../../docs/REPRODUCING.md#what-is-reproduced).

Captured on 9 November 2026 in TokenSavingsRN, initialized with Community CLI 20.2.0, React Native 0.88.1 and React 19.3.0. Ten additional app projects and their native support dependencies are installed.

24 comparisons across real Git states, TS/TSX code, autolinking JSON, npm lockfile, Jest JSON, public demo API JSON, native code/configuration, and actual compiler/build logs. 23 comparisons pass their task-specific completeness checks. One captured intent-to-add case deliberately remains a failed check.

## Primary examples in the slides

| Case | Data | Before | After | Text change | Completeness |
| --- | --- | ---: | ---: | --- | --- |
| rtk-status | Git working tree | 282 | 175 | 37.9% less | Pass |
| rg-navigation | TypeScript / TSX | 4,830 | 108 | 97.8% less | Pass |
| jq-autolinking | React Native config JSON | 7,245 | 130 | 98.2% less | Pass |
| ast-navigation | React TSX AST | 2,405 | 75 | 96.9% less | Pass |
| rep-app | RN app TypeScript / TSX | 4,830 | 2,055 | 57.5% less | Pass |

## All comparisons

| Case | Data | Before | After | Text change | Completeness |
| --- | --- | ---: | ---: | --- | --- |
| rtk-status | Git working tree | 282 | 175 | 37.9% less | Pass |
| rtk-status-intent | Git intent-to-add counterexample | 418 | 153 | 63.4% less | FAIL: omitted 15 paths |
| rtk-diff | Unified diff | 852 | 797 | 6.5% less | Pass |
| rtk-jest | Jest pass log | 483 | 26 | 94.6% less | Pass |
| rtk-tsc-errors | TypeScript diagnostics | 84 | 122 | 45.2% more | Pass |
| rtk-ios-error | Xcode build failure | 19,762 | 221 | 98.9% less | Pass |
| rg-navigation | TypeScript / TSX | 4,830 | 108 | 97.8% less | Pass |
| rg-manifest | Android XML | 248 | 17 | 93.1% less | Pass |
| rg-worklets | Babel JavaScript config | 42 | 35 | 16.7% less | Pass |
| rg-ios-platform | Podfile / Swift / Gradle | 4,060 | 134 | 96.7% less | Pass |
| jq-autolinking | React Native config JSON | 7,245 | 130 | 98.2% less | Pass |
| jq-lockfile | npm package-lock JSON | 180,468 | 276 | 99.8% less | Pass |
| jq-jest-report | Jest report JSON | 2,943 | 39 | 98.7% less | Pass |
| jq-api | Public demo API JSON | 767 | 161 | 79% less | Pass |
| ast-navigation | React TSX AST | 2,405 | 75 | 96.9% less | Pass |
| ast-query | TypeScript AST | 78 | 59 | 24.4% less | Pass |
| ast-schema | TypeScript AST | 507 | 167 | 67.1% less | Pass |
| ast-pressable | React TSX AST | 3,588 | 286 | 92% less | Pass |
| rep-app | RN app TypeScript / TSX | 4,830 | 2,055 | 57.5% less | Pass |
| rep-default-overhead | RN app TypeScript / TSX | 4,830 | 5,464 | 13.1% more | Pass |
| rep-native | Swift / Kotlin / Ruby / Gradle / XML | 4,060 | 4,275 | 5.3% more | Pass |
| rep-config | JSON / JS config / XML / plist | 1,916 | 2,365 | 23.4% more | Pass |
| rtk-ios-build | Successful Xcode build log | 2,104,948 | 103,723 | 95.1% less | Pass |
| rtk-android-build | Successful Gradle build log | 12,384 | 189 | 98.5% less | Pass |

## App checks

40 Jest tests passed. TypeScript and ESLint (zero warnings) passed. CocoaPods, iOS Simulator Debug build, Android Debug APK build and Metro production iOS bundle completed with exit code zero. iOS build: 220.6 s. Android build: 336.0 s. These times are from this machine and are not performance comparisons. No simulator UI or device interaction test is claimed.

## Interpretation

All counts use o200k_base through js-tiktoken 1.0.21, with a cl100k_base cross-check in JSON. Complete captured strings are counted, including source-manifest file headings. Screenshots show excerpts. No model calls, API billing or subscription quota is measured.

RTK diagnostics and native build comparisons use one actual captured log replayed through a filter, so a cold build is not compared against a warm build. Source exit codes are stored separately. The standalone tsc stdin filter returns zero even for a failure log: preserve the producer status with pipefail or use the command wrapper.

The intent-to-add capture omitted 15 new paths in compact RTK status. Its smaller output is not accepted as a successful optimization. Repomix app compression retains 14 paths and 15 exported function names while intentionally dropping implementations. Native/config packaging and short TypeScript diagnostics can increase text. Do not average these percentages across different questions or translate them to a bill reduction.

Full inputs, outputs, commands, verification flags, source hashes, encodings and versions: [benchmarks.json](benchmarks.json). Per-case public text: [cases/](cases/). Initial real setup captures: [captures/](../../captures/).
