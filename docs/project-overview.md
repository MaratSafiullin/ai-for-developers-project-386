# Устройство проекта

Обзор инструментов вокруг проекта: что установлено, как запускается локально, какие есть проверки, CI, хуки и деплой.

Снимок состояния на 2026-10-28, сразу после установки Laravel React Starter Kit. Часть пунктов изменится после тикетов из `.scratch/app-skeleton/`. Они отмечены ниже.

## Стек

### Бэкенд (`composer.json`)

- `laravel/framework` ^13: само приложение.
- `inertiajs/inertia-laravel` v3: контроллер вызывает `Inertia::render('page', $props)`, а браузер получает React-страницу. Отдельного REST API нет.
- `laravel/wayfinder`: генерирует TypeScript-функции для маршрутов и контроллеров (`resources/js/actions`, `resources/js/routes`). Во фронте URL не пишут руками, а импортируют эти функции.
- `laravel/fortify`: авторизация (логин, регистрация, 2FA, passkeys). По условию проекта не нужна, удаляется тикетом `03`.
- `laravel/tinker`: интерактивная консоль (REPL) с загруженным приложением.

### Фронтенд (`package.json`, `resources/js`)

- React 19, TypeScript, Tailwind 4, shadcn/ui (Radix, `components.json`), иконки lucide, тосты sonner.
- Страницы лежат в `resources/js/pages/*.tsx`, точка входа `resources/js/app.tsx`.

### База данных

SQLite (`database/database.sqlite`). Сессии, кеш и очередь хранятся в таблицах БД, письма пишутся в лог. Ни Redis, ни MySQL, ни Docker не нужны.

## Сборка фронта: Vite+

Обычного `vite` здесь нет: через `overrides` в `package.json` он подменён на Vite+ (`vite-plus`, команда `vp`). Это сборщик, линтер (oxlint) и форматтер (oxfmt) в одном. Всё настраивается в `vite.config.ts`:

- `plugins`: laravel, inertia, react, React Compiler через babel, tailwind, wayfinder.
- `lint`: правила линтера. Предупреждения считаются ошибками (`denyWarnings`), включены проверки с учётом типов (`typeAware`).
- `fmt`: правила форматирования (ширина 80, отступ 4, одинарные кавычки, сортировка классов Tailwind).

| npm-скрипт                            | Что делает                                        |
| ------------------------------------- | ------------------------------------------------- |
| `npm run dev`                         | dev-сервер Vite с HMR                             |
| `npm run build`                       | прод-сборка в `public/build`                      |
| `npm run check` / `npm run check:fix` | линтер и форматтер (проверка или автоисправление) |
| `npm run types:check`                 | `tsc --noEmit`                                    |

## Локальная работа

```bash
composer setup   # install, создать .env, key:generate, migrate, npm install, npm run build
composer dev     # = php artisan dev
```

`php artisan dev` — команда Laravel 13. Она запускает в одном окне через `@laravel/multiplex`:

- `server`: `php artisan serve` на http://localhost:8000
- `queue`: `php artisan queue:listen`
- `logs`: `php artisan pail`, логи в реальном времени
- `vite`: `npm run dev`

Прочее: `php artisan route:list`, `php artisan tinker`. Laravel Sail (Docker) установлен как dev-зависимость, но выключен (`"sail": false` в `boost.json`).

## Проверки и линтеры

| Инструмент                         | Что проверяет            | Команда                                 |
| ---------------------------------- | ------------------------ | --------------------------------------- |
| Pint (`pint.json`)                 | стиль PHP                | `composer lint` / `composer lint:check` |
| Larastan (`phpstan.neon`, level 7) | статический анализ PHP   | `composer types:check`                  |
| Pest (`tests/`, `phpunit.xml`)     | тесты PHP                | `php artisan test`                      |
| Vite+ check                        | линтер и формат TS/React | `npm run check`                         |
| tsc                                | типы TypeScript          | `npm run types:check`                   |

Составные команды:

- `composer test`: Pint (проверка) → Larastan → Pest.
- `composer ci:check`: `npm run check` → `npm run types:check` → `composer test`. Единая команда, которая прогоняет всё. Её же запускает CI.

## CI (GitHub Actions)

- `.github/workflows/tests.yml`: на push в `main` и на pull request. Ставит PHP 8.5 и Node 22, затем выполняет `composer setup` и `composer ci:check`.
- `.github/workflows/hexlet-check.yml`: автотесты Хекслета на каждый push. Файл нельзя удалять, менять или переименовывать.
- `.github/dependabot.yml`: раз в неделю обновляет версии GitHub Actions.

## Хуки

- Git-хуков нет: в `.git/hooks` только примеры `*.sample`, формат коммитов не проверяется. Варианты (mise + hk + pitchfork или нативный `core.hooksPath`) разобраны в тикете `06`.
- Composer-хуки (`scripts` в `composer.json`): `post-update-cmd` вызывает `boost:update`, поэтому при каждом `composer update` AGENTS.md и skills перегенерируются под актуальные версии пакетов. Это задумано (см. «AI-инструменты»). На клоне без `boost.json` этот хук, вероятно, роняет `composer update`, это разбирает тикет `01`.
- Хуков Claude Code в проекте нет.

## Деплой

Не настроен: нет Dockerfile, Procfile или конфигурации облака. Boost предлагает Laravel Cloud (`"cloud": true`, есть skill `deploying-to-cloud`), но это лишь подсказка для агентов. Для прода в общем случае нужны `npm run build`, `php artisan migrate --force`, веб-сервер с корнем в `public/` и воркер очереди.

## AI-инструменты (Laravel Boost)

Boost генерирует для агентов три вещи:

- MCP-сервер `php artisan boost:mcp` (`.mcp.json`): поиск документации по версиям пакетов, схема БД, логи, ошибки браузера, запись правил в `.ai/rules`.
- Skills в `.claude/skills/` и `.junie/skills/` (список задан в `boost.json`): best practices Laravel, Inertia React, Tailwind, Wayfinder, тесты и т.д.
- `AGENTS.md`: инструкции для агентов.

### Что в репозитории, а что генерируется

Все перечисленные файлы — `AGENTS.md`, `CLAUDE.md`, `boost.json`, `.mcp.json`, `.claude/`, `.junie/` и каталоги других агентов — лежат в `.gitignore`. Это решение стартер-кита, и проект его сохраняет:

- содержимое зависит от версий пакетов в `composer.lock`, поэтому его генерируют, а не хранят, как `vendor/`;
- у разработчиков разные агенты (Claude Code, Cursor, Junie…), и каждый генерирует файлы только под свои;
- `boost:update` в `post-update-cmd` намеренно перезаписывает их при обновлении пакетов.

Генерация на свежем клоне: `php artisan boost:install` (интерактивно спрашивает, под каких агентов). Обновление: `php artisan boost:update`.

### Куда писать свои правила

Закоммиченный каталог `.ai/` — единственное место для проектных инструкций:

| Путь                         | Назначение                                                         |
| ---------------------------- | ------------------------------------------------------------------ |
| `.ai/guidelines/*.md`        | правила, которые вклеиваются в AGENTS.md при генерации             |
| `.ai/skills/<name>/SKILL.md` | свои skills, раскладываются вместе со встроенными                  |
| `.ai/rules/`                 | правила с привязкой к путям, их пишет MCP-инструмент `record-rule` |

Файл в `.ai/guidelines/` или `.ai/skills/` с тем же путём или именем, что у встроенного, заменяет встроенный. Править AGENTS.md руками бесполезно: правка не попадёт в git и пропадёт при следующем `boost:update`.

## Нюансы

- В репозитории лежат и `package-lock.json`, и `pnpm-workspace.yaml`. Пакетный менеджер не выбран, по факту используется npm.
- Версия PHP нигде не зафиксирована: в `composer.json` указано `^8.3`, в CI 8.5, локально PHP из Homebrew. Node зафиксирован только в CI.
- В `composer.json` есть `laravel/chisel` и `laravel/pao`, их назначение не разбиралось.

## Быстрый старт

1. `composer setup`
2. `composer dev`
3. Перед коммитом: `composer ci:check`
