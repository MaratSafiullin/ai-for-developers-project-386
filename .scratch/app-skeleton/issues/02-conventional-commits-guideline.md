# 02: Правило Conventional Commits в `.ai/guidelines`

**What to build:** агент, открывший AGENTS.md, находит короткое правило: сообщения коммитов пишутся по Conventional Commits, с перечнем допустимых типов (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`) и ссылкой на спецификацию. Правило лежит в закоммиченном файле `.ai/guidelines/conventional-commits.md`, а в AGENTS.md попадает через `php artisan boost:update`. Сам AGENTS.md руками не правится и не коммитится, `/init` не запускается.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Есть `.ai/guidelines/conventional-commits.md` с правилом и списком типов
- [ ] После `php artisan boost:update` правило появляется в локальном AGENTS.md и не противоречит остальным правилам файла
- [ ] В коммит попадает только файл из `.ai/guidelines/`. AGENTS.md остаётся в `.gitignore`
- [ ] Коммит в формате Conventional Commits (например, `docs: add conventional commits guideline for agents`)
