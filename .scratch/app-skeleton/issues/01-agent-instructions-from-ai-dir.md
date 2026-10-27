# 01: Инструкции агентов генерируются из `.ai/`, `composer update` работает на свежем клоне

**What to build:** проектные инструкции и skills для агентов хранятся в закоммиченном каталоге `.ai/`, а AGENTS.md, `boost.json`, `.mcp.json`, `.claude/` и `.junie/` остаются локальными сгенерированными файлами, как задумано в Laravel Boost. Перегенерация при `composer update` остаётся: она подтягивает инструкции под актуальные версии пакетов и вклеивает в AGENTS.md содержимое `.ai/guidelines/`. `composer update` не падает на клоне, где ещё не запускали `php artisan boost:install`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

## Контекст

- Стартер-кит кладёт в `.gitignore` AGENTS.md, CLAUDE.md, `boost.json`, `.mcp.json` и каталоги агентов (`.claude`, `.junie`, `.cursor` и др.). Их генерирует `php artisan boost:install` под агентов, выбранных конкретным разработчиком.
- Свои правила по документации Boost кладут в `.ai/guidelines/*.md` (вклеиваются в AGENTS.md), свои skills в `.ai/skills/<name>/SKILL.md`, правила с привязкой к путям в `.ai/rules/` (пишет MCP-инструмент `record-rule`). Файл в `.ai/` с тем же путём, что у встроенного, заменяет встроенный.
- `boost:update` без `boost.json` возвращает ошибку «Please set up Boost with [php artisan boost:install] first.» (`vendor/laravel/boost/src/Console/UpdateCommand.php`). Он вызывается в `post-update-cmd`, поэтому `composer update` на свежем клоне, вероятно, завершится с ошибкой. Это нужно проверить.

## Acceptance criteria

- [ ] `boost:update` остаётся в `post-update-cmd`, guidelines в Boost не выключаются
- [ ] Проверено, падает ли `composer update` на клоне без `boost.json`. Если падает, хук пропускает `boost:update`, когда Boost не установлен, и не глушит другие ошибки
- [ ] `.ai/` не попадает под `.gitignore`. AGENTS.md, CLAUDE.md, `boost.json`, `.mcp.json`, `.claude/`, `.junie/` остаются в `.gitignore`
- [ ] AGENTS.md руками не правится
- [ ] `composer ci:check` зелёный
- [ ] Коммит в формате Conventional Commits (например, `build: skip boost update when boost is not installed`)
