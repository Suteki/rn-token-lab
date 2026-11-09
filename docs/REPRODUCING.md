# Повторення експерименту

Це той самий React Native CLI застосунок, на якому отримано приклади для презентації «Економія токенів на (пет) проєктах». Дані походять із вихідного коду, CLI, HTTP-відповіді демонстраційного API та справжніх логів збірки. Синтетичні файли з випадковим текстом не використовуються.

## 1. Clone та перевірка архіву

```sh
git clone https://github.com/Suteki/rn-token-lab.git
cd rn-token-lab
nvm install
nvm use
npm --prefix benchmarks ci
npm run bench:verify
```

Цей режим не потребує Xcode, Android SDK, RTK, API-ключів або викликів LLM. Він перераховує обидва токенізатори для всіх 24 пар before/after та перевіряє SHA-256 публічних текстів. Одна пара навмисно має невдалу перевірку повноти: RTK 0.40.0 пропустив intent-to-add шляхи. Це збережений контрприклад, а не падіння `bench:verify`.

Якщо `nvm` не використовується, встановіть Node 26.0.0 іншим способом. Контрольний прогін виконувався на macOS arm64; CI перевіряє застосунок і публічний архів на Linux. Встановлення npm-пакетів потребує мережі та запускає їхні install scripts.

## 2. Запуск застосунку й повторна фільтрація

Встановіть RTK, ripgrep та jq із довірених джерел. Версії початкового прогону: RTK **0.40.0**, ripgrep **15.1.0**, jq **1.8.1**. Версії ast-grep 0.51.1, Repomix 1.19.0 і js-tiktoken 1.0.21 зафіксовані в benchmark lockfile.

Для RTK, якщо встановлений Rust/Cargo:

```sh
cargo install --git https://github.com/rtk-ai/rtk --tag v0.40.0 --locked
```

Новіші RTK можуть мати інші назви команд, формат виводу й виправлені помилки. `bench:doctor` показує локальні версії; не змінює систему. RTK не встановлює глобальні hooks для цього проєкту автоматично.

```sh
rtk proxy npm ci
rtk proxy npm --prefix benchmarks ci
rtk proxy npm run bench:doctor
rtk proxy npm run check
rtk proxy npm run bench:all
```

`check` запускає TypeScript, ESLint і 40 Jest-тестів. `bench:all` виконує 22 основні порівняння та додає два replay успішних native build-логів. Результат: `benchmarks/results/benchmarks.json`, `benchmarks.csv`, `RESULTS.md`, `cases/`. Ці файли ігноруються Git. Архів у `benchmarks/snapshots/2026-11-09/` залишається незмінним.

Типи джерел:

| Джерело | Що відбувається в новому прогоні |
| --- | --- |
| TS/TSX, XML, Podfile, lockfile, конфігурації | Читається поточний код із явного scope |
| Autolinking | Заново виконується React Native config |
| Jest | Заново запускаються тести, з одного результату отримуються обидва представлення |
| Git status / diff | У тимчасовому Git-репозиторії відтворюється набір змін реального RN-проєкту від baseline `1bac4f5`; робочий clone не змінюється |
| Git intent-to-add | Відтворюється збережена пара з помилкою RTK 0.40.0; це історична перевірка, не твердження про нові версії |
| JSONPlaceholder API | За замовчуванням збережена реальна відповідь; `BENCH_LIVE_API=1` вмикає новий HTTP-запит |
| Початкові помилки TypeScript / Xcode | Replay історичних помилок; у поточному коді вони виправлені |
| Успішні iOS / Android build logs | Replay збережених збірок, якщо власні нові captures ще не створено |

Щоб перевірити конкретну команду вручну, відкрийте `beforeCommand` / `afterCommand` відповідного кейсу. Частина підписів історичного архіву описує оригінальний запуск; актуальні виконувані команди містяться в scripts і новому results JSON.

## 3. Власні native captures

Потрібні Xcode і CocoaPods для iOS, JDK 17 та Android SDK з версіями із Gradle-конфігурації для Android. Налаштуйте власний `ANDROID_HOME` або `android/local.properties`. Локальні SDK-шляхи не входять до репозиторію. Java 17 та конфігурацію SDK перевіряйте також за [документацією RN](https://reactnative.dev/docs/set-up-your-environment).

```sh
rtk proxy npm run check
rtk proxy npm run native:pods
rtk proxy npm run native:ios
rtk proxy npm run native:android
rtk proxy npm run native:metro
rtk proxy npm run bench:all
```

Скрипти зберігають stdout, stderr, exit code і тривалість у `benchmarks/results/native/`. Якщо там є власний iOS capture, фінальний крок очікує весь набір pods/ios/android/metro та checks. Успішна компіляція не означає перевірені UI-сценарії.

Запуск інтерфейсу:

```sh
rtk proxy npm start
# В іншому терміналі:
rtk proxy npm run ios
# або:
rtk proxy npm run android
```

Застосунок читає публічні demo tasks; локальні чернетки й обрані зберігаються на пристрої. UI може потребувати доступу до JSONPlaceholder. Benchmark за замовчуванням не потребує доступу до цього API.

## Що саме відтворюється

Початкові цифри презентації записані в `snapshots/2026-11-09/benchmarks.json`. Перед публікацією персональні абсолютні шляхи в логах замінені на `/workspace/rn-token-lab` і `/home/demo`. Така зміна впливає на токенізацію. Тому:

- `benchmarks.json` зберігає **початкові виміряні числа**, використані на слайдах;
- `published-counts.json` містить **точні числа для опублікованого тексту** в обох токенізаторах;
- `redaction-manifest.json` містить SHA-256 оригіналів та опублікованих файлів і ознаку redaction;
- `bench:verify` перевіряє саме публічний архів; `bench:all` створює власний новий вимір.

Нові абсолютні шляхи, Git-стан, версії ОС, інструментів і timings можуть змінити результат. Не очікуйте ідентичності нового live run із початковими слайдами.

Рахуємо повні текстові результати за `o200k_base` і `cl100k_base`, не provider usage. Це не фактичні витрати Claude/Codex, квота підписки чи економія всієї сесії. AST/Repomix перевірки контролюють потрібні для задачі символи/шляхи, а не доводять повну семантичну еквівалентність. Для debugging потрібні оригінали. Невигідні кейси також залишені в архіві.

## Правила для агентів

Спільні короткі правила: `AGENTS.md`. Claude підключає їх через `@AGENTS.md` у `CLAUDE.md`. Приклади tool config і безпечного підключення: [AGENT-SETUP.md](AGENT-SETUP.md). Markdown-інструкція не встановлює CLI, не створює MCP-сервер і не надає дозволів. Власні налаштування й API-ключі до Git не додавайте.

## Мова промптів: окремий локальний приклад

`npm --prefix benchmarks run language:sample` рахує три зіставлені RN-промпти українською та англійською і незмінну CLI-команду. Це підрахунок тексту двома токенізаторами, без викликів моделей. Він не доводить універсальний коефіцієнт вартості, однакову якість перекладів або економію цілої сесії.
