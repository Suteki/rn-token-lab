# Налаштування інструментів для Codex і Claude Code

Усі шляхи нижче відносні до `rn-token-lab/`, якщо не починаються з `~/`. Приклади конфігурації вже збережені в цьому проєкті. Глобальні налаштування користувача ця зміна не встановлює і не перезаписує.

## Де зберігати

| Що | Файл | Хто читає |
| --- | --- | --- |
| Спільні короткі правила | `AGENTS.md` у корені RN-проєкту | Codex; Claude через імпорт нижче |
| Інструкції Claude | `CLAUDE.md` з рядком `@AGENTS.md` | Claude Code |
| Особисті правила Codex | `~/.codex/AGENTS.md` | Codex у різних проєктах |
| Особисті правила Claude | `~/.claude/CLAUDE.md` | Claude Code у різних проєктах |
| Claude hooks / settings для команди | `.claude/settings.json` | Claude Code; файл можна комітити після рев’ю |
| Особисті Claude settings | `~/.claude/settings.json` або `.claude/settings.local.json` | Власний користувач; local-файл виключити з Git |
| Codex runtime settings | `~/.codex/config.toml`; довірений проєкт також може мати `.codex/config.toml` | Codex; це окремо від текстових правил |
| Пошукові виключення | `.rgignore` | ripgrep |
| JSON-проєкція | `tools/jq/autolink.jq` | jq з `-f`, автоматичного підхоплення немає |
| AST-правила | `sgconfig.yml` і `tools/ast-rules/navigation.yml` | ast-grep scan |
| Структурний пакет | `repomix.config.json` | Repomix; результат `.agent-context/app.xml` |

Codex збирає глобальні та проєктні інструкції на початку запуску. У каталозі `AGENTS.override.md` має перевагу над `AGENTS.md`. Після зміни перевірте правила в новій сесії з робочою папкою `rn-token-lab/`.

Поточний Claude Code також може читати `AGENTS.md` напряму, але поведінка залежить від версії й наявності `CLAUDE.md` вище по дереву. У цьому прикладі використано явний імпорт, щоб обидва агенти отримували один файл правил. Це не окремий механізм економії: імпортований текст теж займає контекст. Детальний посібник не імпортуємо автоматично.

## RTK: спочатку перевірка версії

Встановіть RTK з офіційного репозиторію / пакета, перевірте `rtk --version`. У вимірах використано **0.40.0**.

```sh
rtk proxy rtk init --codex --dry-run -v
rtk proxy rtk init -g --dry-run -v
```

Ці команди лише показують зміни. RTK 0.40.0 для Codex пропонує `AGENTS.md` + `RTK.md`, без Claude hook. Команду без `--dry-run` запускайте після перегляду запропонованих змін. У наявному `AGENTS.md` цього проєкту правило використання RTK вже записане явно; додатковий init не потрібен для ручних wrapper-викликів.

Для Claude глобальний `rtk init -g` цієї версії пропонує `~/.claude/RTK.md`, імпорт у `~/.claude/CLAUDE.md` та `PreToolUse` hook у `~/.claude/settings.json`. Встановлювач має **об’єднати** hook з наявними settings, а не замінити весь JSON. Фрагмент hook для ручного рев’ю:

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

Наявність `rtk gain` не доводить, що hook увімкнено. Перезапустіть агент, виконайте одну просту команду й перевірте фактичний tool call та `rtk gain --history`. У новіших RTK інтеграція Codex може відрізнятися; звіряйте власні `rtk init --help` і `--dry-run`. Для точного виводу 0.40.0 використовуйте `rtk proxy`; у новій документації ця команда має назву `rtk bypass`.

Не додавайте широке `allow Bash(*)` заради економії. Переглядайте hook як виконуваний код. RTK може зберігати raw-логи локально: враховуйте їхній вміст і строки зберігання.

## ripgrep

Встановіть `ripgrep` з довіреного пакетного менеджера, перевірте `rtk proxy rg --version`. `.rgignore` містить deps, build-папки та згенерований контекст. `AGENTS.md` задає порядок: спочатку імена файлів, потім рядки з контекстом.

```sh
rtk proxy rg -l 'createNativeStackNavigator' src
rtk proxy rg -n -C 3 'createNativeStackNavigator<' src/navigation
```

`.rgignore` не забороняє пряме читання файлів агентом. Не додавайте `--no-ignore` або `--hidden` без потреби. Якщо результат неповний, розширюйте scope явно.

## jq

Встановіть `jq` з довіреного пакетного менеджера. Фільтр читається через `-f tools/jq/autolink.jq`. Команда в `AGENTS.md` запускає невеликий Node wrapper, який спочатку перевіряє exit code RN config, а потім jq; помилка producer не перетвориться на успішну порожню проєкцію.

```sh
rtk proxy node tools/agent-autolinks.mjs
```

Очікуємо 8 native modules з `ios` / `android` прапорцями. Для налагодження одного модуля прочитайте його повний JSON-запис. Не використовуйте `eval` для даних JSON.

## ast-grep

Версія 0.51.1 зафіксована в `benchmarks/package-lock.json`; встановлення локальних інструментів: `rtk proxy npm --prefix benchmarks ci`. `sgconfig.yml` реєструє папку правил, YAML задає TSX-патерн без rewrite.

```sh
rtk proxy benchmarks/node_modules/.bin/ast-grep scan \
  --filter rn-navigation-call src/screens --color never
```

Очікуємо 3 виклики. Правило шукає синтаксис, а не розв’язує типи / aliases. Не додавайте `--update-all` до пошукової інструкції; виправлення перевіряйте окремим diff.

## Repomix

Версія 1.19.0 також зафіксована в локальному benchmark lockfile. `repomix.config.json` містить явний include лише `App.tsx` і `src/**/*`, `output.compress: true` та увімкнену перевірку секретів.

```sh
rtk proxy benchmarks/node_modules/.bin/repomix --config repomix.config.json
```

Пакет зберігається в `.agent-context/app.xml` і виключений із Git. Перевірте 14 шляхів і вміст перед передачею моделі. Secretlint може пропустити секрет; не вимикайте його через `--no-security-check`. Реалізації функцій прибрані, тому для виправлення логіки потрібен оригінал.

## Перевірка, що агент застосував правила

1. Відкрийте нову сесію саме з `rn-token-lab/`. У Codex попросіть назвати активні instruction-файли й команду для пошуку native stack. У Claude перевірте `/memory` та `/context all`: має бути `CLAUDE.md` з імпортованими правилами.
2. Попросіть знайти native stack без читання всього репозиторію. Перевірте реальний tool call: scope `src`, `rg`, потім вузьке читання. Сам переказ правил агентом не доводить їх виконання.
3. Перевірте 8 modules, 3 navigation calls і 14 шляхів у структурному пакеті. Перегляньте `rtk gain --history`, raw status і коди завершення.

Сторонній репозиторій може містити шкідливі instruction-файли, hooks і package scripts. Рев’ю та sandbox залишаються потрібними. Інструкція в Markdown сама по собі не встановлює CLI, не запускає hook і не створює доступів.

## Джерела, перевірені 09.11.2026

- [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Codex configuration](https://learn.chatgpt.com/docs/config-file/config-advanced)
- [Claude memory and imports](https://code.claude.com/docs/en/memory)
- [Claude settings scopes](https://code.claude.com/docs/en/settings)
- [RTK integration](https://github.com/rtk-ai/rtk) та локальний `rtk init --help` / dry-run 0.40.0
- [ripgrep guide](https://raw.githubusercontent.com/BurntSushi/ripgrep/master/GUIDE.md)
- [jq manual](https://jqlang.org/manual/)
- [ast-grep project config](https://ast-grep.github.io/reference/sgconfig.html)
- [Repomix config](https://repomix.com/guide/configuration) і [security](https://repomix.com/guide/security)
