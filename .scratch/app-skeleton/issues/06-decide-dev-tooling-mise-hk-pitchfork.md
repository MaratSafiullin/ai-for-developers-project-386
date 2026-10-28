# 06: Решить, нужны ли mise, hk и pitchfork, или хватит нативных инструментов Laravel

**What to build:** принятое и записанное решение о том, как закрыть рекомендации шага «Каркас приложения» по окружению разработки: фиксацию версий инструментов, единую задачу проверок, git-хуки (в том числе проверку сообщений коммитов) и фоновые процессы разработки. Варианты: mise + hk + pitchfork или нативные инструменты фреймворка, возможно с отказом от mise совсем.

**Blocked by:** None (can start immediately)

**Status:** done

## Что рекомендует шаг

- `mise.toml` фиксирует версии инструментов, переменные окружения и задачи установки, запуска, сборки и проверок
- Единая задача `mise run check` (линтер, проверка типов, дымовой тест), её же вызывает GitHub Actions
- Git-хуки через hk, установленный mise, вызывают те же проверки
- Фоновые процессы через daemons mise/pitchfork, с `experimental = true` и зафиксированной версией pitchfork
- CI на каждый push

## Что есть сейчас (нативно)

- Единая команда проверок `composer ci:check`: Vite+ check, `tsc --noEmit`, Pint `--test`, Larastan, Pest
- Запуск для разработки: `composer dev` (`php artisan dev`)
- CI `tests.yml`: setup-php 8.5 и Node 22 через actions, `composer setup` и `composer ci:check`, push в `main` и pull request. Веток в учебном проекте не будет, поэтому этого достаточно
- Версии: PHP задан ограничением в `composer.json` и версией в CI, Node только в CI, локально PHP из Homebrew
- Git-хуков нет, формат коммитов не проверяется

## Факты, собранные при исследовании (2026-10-28)

- **PHP через mise.** Core-плагина нет. В реестре `vfox:jdx/vfox-php`, запасной вариант `asdf-php`, оба собирают PHP из исходников (нужны autoconf, bison, re2c, libxml), в CI это минуты. Альтернатива: готовые бинарники static-php-cli (`dl.static-php.dev`, есть 8.5.x для linux/macos x86_64/aarch64) через `http:` backend mise с URL под каждую платформу. Ограничения: фиксированный набор расширений (надо проверить pdo_sqlite, mbstring, intl и др.), xdebug и pcov недоступны, покрытия не будет.
- **Composer** в реестре mise отсутствует: phar через `http:` backend или postinstall-хук. vfox-php ставит его сам.
- **Node** через core-плагин mise, готовые бинарники, быстро.
- **Daemons** объявляются в `pitchfork.toml` (`[daemons.<name>]`, `run`, `ready_http`, `mise = true`), версия pitchfork фиксируется в `[tools]` mise. Источники: pitchfork.jdx.dev, раздел mise-integration.
- **hk.** Конфиг `hk.pkl` (Pkl), установка `mise use hk`, затем `hk install --mise`. Шаги верхнего уровня работают как `check`, `fix` и `pre-commit`. Встроенных шагов для Pint и PHPStan нет, нужны свои. Для commit-msg есть встроенный `check_conventional_commit` (без Node).
- **CI:** `jdx/mise-action@v5`, кеш mise по умолчанию. Кеши composer и npm настраиваются отдельно.
- **dev-guardrails** — подборка mokevnin (github.com/mokevnin/dev-guardrails). Для стека: PHP — Mago (молодой, Larastan пока не заменять), Rector `--dry-run`. TS — oxlint и oxfmt с `--deny-warnings`, `tsc` strict, Knip. Хуки — hk, в CI `hk check --all`. CI — actionlint, zizmor, Betterleaks. Коммиты — commitlint или hk `check_conventional_commit`.

## Нативная альтернатива для commit-msg без mise и hk

Bash-скрипт в каталоге хуков в репозитории, подключённый через `git config core.hooksPath`, который выставляет composer-скрипт установки.

## Отложенные решения

- [x] Фиксация версий PHP, Composer и Node в проекте: mise (static-php-cli или сборка) или нативно (`.nvmrc` или `engines`, `composer.json` platform)
- [x] Единая команда проверок: `mise run check` или оставить `composer ci:check`
- [x] Git-хуки и проверка сообщений коммитов: hk или нативный `core.hooksPath`
- [x] Фоновые процессы разработки: pitchfork daemons или `composer dev`
- [x] Какие дополнительные инструменты из dev-guardrails подключать
- [x] Выбор между npm и pnpm (сейчас в репозитории файлы обоих)

## Решение (2026-10-28)

Курс mise не требует. mise, hk и pitchfork не используем, рекомендации шага закрываем нативными средствами.

- **Версии.** `require.php` в `composer.json` поднят до `^8.5`, так что ограничение совпадает с CI и локальным PHP. Без `config.platform`: lock собирается на той же версии PHP. Node 22 зафиксирован в `.nvmrc`, CI читает его через `node-version-file`, `engines.node: ">=22"` в `package.json` только предупреждает (без `engine-strict`). Мажорную версию Node не поднимаем.
- **Единая команда проверок** остаётся `composer ci:check`.
- **Фоновые процессы** запускает `composer dev`.
- **Коммиты.** Хук `.githooks/commit-msg` на bash проверяет первую значимую строку, то есть первую непустую и не начинающуюся с `#`: `type(scope)!: description`, типы из `.ai/guidelines/conventional-commits.md`, описание со строчной буквы и без точки в конце. Сообщения, которые генерирует git (`Merge`, `Revert "…"`, `fixup!`, `squash!`, `amend!`), пропускаются. `composer setup` подключает хук через `git config core.hooksPath .githooks`. В CI шага нет: веток нет, push идёт сразу в `main`, так что CI сообщил бы об ошибке только после push. В правиле для агентов записано: хук не обходить через `--no-verify`, промежуточные коммиты оформлять по тем же правилам.
- **Пакетный менеджер:** npm. `pnpm-workspace.yaml` от стартер-кита остаётся.
- **dev-guardrails** в этот тикет не входит; если понадобится, будет отдельный тикет.

ADR не пишем: отказ от mise легко отменить, добавив его позже.

### Отвергнутые варианты

- **mise + hk + pitchfork полностью.** У PHP в mise нет готового плагина: остаётся сборка из исходников (это минуты в CI) или static-php-cli без xdebug и pcov. pitchfork дублирует `composer dev`.
- **mise только для Node и hk.** Ради одной версии Node и одного хука пришлось бы ставить ещё два инструмента на каждый клон. `.nvmrc` и bash-хук решают ту же задачу без зависимостей.
- **commitlint + husky.** Новые npm-зависимости ради регулярного выражения.
- **Проверка коммитов в CI.** Без веток не мешает плохому коммиту попасть в `main`.
