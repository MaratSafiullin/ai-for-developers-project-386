# Генераторы контракта: TypeSpec → OpenAPI → SDK и серверные артефакты

Исследование для issue #15 (карта #10). Версии и даты сняты с npm registry и Packagist на момент проверки. Тестовый прогон цепочки выполнялся во временной папке вне репозитория, код и зависимости проекта не менялись.

## Короткий ответ

| Звено | Выбор | Версия |
| --- | --- | --- |
| TypeSpec → OpenAPI | `@typespec/openapi3` (официальный эмиттер) | 1.17.0, вместе с `@typespec/compiler` и `@typespec/http` 1.17.x |
| OpenAPI → TypeScript SDK | `@hey-api/openapi-ts` с клиентом fetch, версия закреплена точно | 0.99.0 (на Node 22.17.1 проверена и 0.97.3) |
| Серверные артефакты для Laravel | Генератора нет. Серверную часть пишем руками по контракту, соответствие проверяют контрактные тесты | Spectator 3.0.4 или kirschbaum-development/laravel-openapi-validator 2.0.2 |
| Одна команда | npm-скрипты `contract:generate` и `contract:check`, `contract:check` входит в `composer ci:check` | см. раздел «Одна команда» |

Версия OpenAPI: 3.0.0 (значение по умолчанию эмиттера). Причина в разделе «Серверная сторона».

## 1. Эмиттер TypeSpec → OpenAPI

- Пакет `@typespec/openapi3` 1.17.0, `engines.node >=22.0.0`, peer-зависимости: `@typespec/compiler`, `@typespec/http`, `@typespec/openapi` ^1.17.0 (опционально `versioning`, `json-schema` и др.). Источник: [npm registry](https://registry.npmjs.org/@typespec/openapi3/latest).
- `@typespec/compiler` 1.17.0, `engines.node >=22.0.0`. Источник: [npm registry](https://registry.npmjs.org/@typespec/compiler/latest).
- Подключение через `tspconfig.yaml` (`emit:` + `options:`) или `tsp compile . --emit=@typespec/openapi3`. Источник: [документация эмиттера](https://typespec.io/docs/emitters/openapi3/reference/emitter/), исходник страницы: [emitter.md](https://github.com/microsoft/typespec/blob/main/website/src/content/docs/docs/emitters/openapi3/reference/emitter.md).
- Опции, важные для проекта (имена и значения по умолчанию из той же страницы):
  - `emitter-output-dir` (по умолчанию `{output-dir}/@typespec/openapi3`);
  - `output-file` (по умолчанию `{service-name-if-multiple}.{version}.openapi.yaml`, для одного сервиса без версий получается `openapi.yaml`);
  - `file-type`: `yaml` (по умолчанию) или `json`;
  - `openapi-versions`: `3.0.0` (по умолчанию), `3.1.0`, `3.2.0`;
  - `omit-unreachable-types`, `seal-object-schemas` (по умолчанию `false`; при `true` добавляет `additionalProperties: false` для 3.0), `operation-id-strategy` (по умолчанию `parent-container`), `new-line` (по умолчанию `lf`).
- У `tsp compile` нет режима «проверить актуальность вывода». Есть `--no-emit` (только проверка контракта), `--dry-run`, `--warn-as-error`, `--watch`, `--output-dir`, `--config`, `--emit`, `--options`. Источник: [args.ts компилятора](https://github.com/microsoft/typespec/blob/main/packages/compiler/src/core/cli/actions/compile/args.ts), общее описание CLI: [Cli usage](https://typespec.io/docs/handbook/cli/).
- Нюанс именования: при `operation-id-strategy: parent-container` операция `list` в интерфейсе `MeetingTypes` получает `operationId: MeetingTypes_list`, и SDK называет функцию `meetingTypesList`. Имена можно задать декоратором `@operationId` или сменить стратегию.

### Что проверено на практике

Минимальный контракт (интерфейс `MeetingTypes` с `GET /meeting-types` и `POST /meeting-types`) со следующим `tspconfig.yaml` скомпилировался без предупреждений на Node 22.17.1 за 9 мс:

```yaml
emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    emitter-output-dir: "{project-root}/out"
    file-type: yaml
    output-file: openapi.yaml
    openapi-versions:
      - "3.0.0"
```

Результат: валидный `openapi: 3.0.0`, схемы `MeetingType` и `CreateMeetingType` в `components.schemas`, коды ответов 200 и 201.

## 2. Генератор TypeScript SDK

### Кандидаты

| Инструмент | Версия | Node (`engines`) | Что делает | Замечания |
| --- | --- | --- | --- | --- |
| `@hey-api/openapi-ts` | 0.99.0 (2026-06-22) | `>=22.18.0` | Типы, функции SDK, клиент fetch/axios/ky и др., 20+ плагинов (zod, TanStack Query) | Версия 0.x, документация: пакет «in initial development», рекомендует закреплять точную версию. Peer: `typescript >=5.5.3` |
| `orval` | 8.45.0 | `>=22.18.0` | Клиенты и хуки (react-query, swr, axios, fetch), моки MSW, zod | Тоже требует Node 22.18 |
| `openapi-typescript` + `openapi-fetch` | 7.13.0 и 0.17.0 | не заданы | Только типы из схемы плюс маленький типизированный fetch-клиент, функций-обёрток по операциям нет | Минимум магии, зависит от `typescript ^5` |
| `@typespec/http-client-js` | 0.16.3 | не проверялось | Клиент прямо из TypeSpec, минуя OpenAPI | Версия 0.x. Обходит требование цепочки через OpenAPI, поэтому не берём |
| `@openapitools/openapi-generator-cli` | 2.42.0 | `>=22.0.0` | Обёртка над Java-генератором | Нужна JRE, избыточно для фронтенда |

Источники: страницы пакетов в registry ([hey-api](https://registry.npmjs.org/@hey-api/openapi-ts/latest), [orval](https://registry.npmjs.org/orval/latest), [openapi-typescript](https://registry.npmjs.org/openapi-typescript/latest), [openapi-fetch](https://registry.npmjs.org/openapi-fetch/latest), [openapi-generator-cli](https://registry.npmjs.org/@openapitools/openapi-generator-cli/latest)), [Hey API: get started](https://heyapi.dev/openapi-ts/get-started), [список клиентских эмиттеров TypeSpec](https://typespec.io/docs/emitters/clients/introduction/).

### Рекомендация: `@hey-api/openapi-ts`

Причины: готовые функции по операциям (`meetingTypesList(...)`) и типы запросов и ответов из одной команды, клиент fetch без внешней зависимости (`client.gen.ts` кладётся в выходную папку), перехватчики запросов и ответов, ручная настройка `baseUrl` через `client.setConfig`. Источник: [Hey API: fetch client](https://heyapi.dev/openapi-ts/clients/fetch). Запасной вариант: `openapi-typescript` + `openapi-fetch`, если 0.x-нестабильность hey-api окажется проблемой.

### Совместимость с текущей сборкой

Проверено в тестовом прогоне (Node 22.17.1, TypeScript 5.9.3 как в `package-lock.json` проекта):

- Команда `openapi-ts -i openapi.yaml -o out/sdk -c @hey-api/client-fetch` отработала и для 0.97.3, и для 0.99.0. Сгенерировано 16 файлов: `sdk.gen.ts`, `types.gen.ts`, `client.gen.ts`, `index.ts`, папки `client/` и `core/`.
- Типы получились ожидаемые: `MeetingType`, `CreateMeetingType`, `MeetingTypesCreateResponses = { 201: MeetingType }`.
- Повторный запуск той же версии дал идентичные файлы (`diff -r` пуст), то есть вывод детерминирован.
- Выводы 0.97.3 и 0.99.0 отличаются (аннотации возвращаемых типов, новый тип `ClientMeta`, правки `core/params.gen.ts`). Версию нужно закрепить точно, иначе проверка актуальности будет давать ложные расхождения при обновлении.
- Без установленного TypeScript npm подтянул в качестве peer TypeScript 7.0.2, и hey-api упал (`ts.NewLineKind` is undefined). В проекте TypeScript 5.9.3, то есть всё работает, но TypeScript 7 как зависимость сейчас несовместим.

Node и `engines`:

- И hey-api 0.99.0, и orval 8.45.0 заявляют `node >=22.18.0`. На локальной Node 22.17.1 npm печатает предупреждения `EBADENGINE` (и для `@babel/code-frame@8`, `undici@8`, `@scalar/json-magic` с требованием `>=22.19.0` среди транзитивных зависимостей), но генерация при этом работает.
- `.nvmrc` проекта содержит `22`, то есть CI получит свежую 22.x и расхождения не будет. В `package.json` стоит `"engines": {"node": ">=22"}`. После добавления hey-api стоит поднять до `>=22.18` или принять предупреждения на устаревшем локальном Node.
- В Vite+ (`vite.config.ts`) генерация не участвует: SDK создаётся отдельной CLI-командой и не требует плагина Vite. Для Vite 5–8 у Hey API есть отдельный `@hey-api/vite-plugin`, он не нужен.

### Взаимодействие с линтером и форматтером

- Сгенерированный код оформлен не по настройкам `fmt` проекта (в тестовом выводе отступы разные: 2 пробела в `core/` и `client/`, 4 пробела в `sdk.gen.ts` и `types.gen.ts`; `fmt` проекта задаёт `tabWidth: 4`). Файлы нужно исключить в `vite.config.ts` через `lint.ignorePatterns` и `fmt.ignorePatterns` (для Wayfinder это уже сделано для `resources/js/actions/**`, `routes/**`, `wayfinder/**`).
- Альтернатива: `output.postProcess` у hey-api с пресетами `oxfmt`, `prettier`, `biome:format` и др. (источник: [Hey API: output](https://heyapi.dev/openapi-ts/configuration/output)). Минус: форматирование должно совпадать с `vp check`, иначе проверка актуальности расходится с форматтером проекта.
- `npm run types:check` (`tsc --noEmit`) охватывает только `resources/js/**`. Если положить SDK туда (например `resources/js/api/`), сгенерированные типы проверяются компилятором автоматически.
- По умолчанию hey-api очищает выходную папку при каждом запуске (`clean`), своих файлов туда класть нельзя.

## 3. Серверная сторона (Laravel/PHP)

### Генерация из контракта: готового решения нет

- У TypeSpec есть серверные эмиттеры только для C# (`http-server-csharp`) и JavaScript (`http-server-js`), PHP нет. Источник: каталог [emitters/servers](https://github.com/microsoft/typespec/tree/main/website/src/content/docs/docs/emitters/servers) и [клиентов](https://github.com/microsoft/typespec/tree/main/website/src/content/docs/docs/emitters/clients) в репозитории TypeSpec.
- `openapi-generator`, генератор `php-laravel`: статус STABLE, «Generates a php-laravel server», в документации нет упоминаний версии Laravel и OpenAPI 3.1. Источник: [php-laravel](https://openapi-generator.tech/docs/generators/php-laravel/). Это шаблонный генератор каркаса на Mustache, под Laravel 13 и Pest не проверен, подтверждений совместимости нет.
- `ensi/laravel-openapi-server-generator` 4.0.5 (2026-04-15): генерирует маршруты, контроллеры, Form Request, enum, resources через расширения `x-lg-*` в схеме. Требует `laravel/framework ^9 || ^10 || ^11 || ^12`, Laravel 13 (в проекте `laravel/framework` v13.38.0) не поддерживается. Источник: [Packagist](https://repo.packagist.org/p2/ensi/laravel-openapi-server-generator.json), [репозиторий](https://github.com/ensi-platform/laravel-openapi-server-generator). Требует расширений `x-lg-*`, а TypeSpec-эмиттер их не пишет без дополнительных декораторов.
- Вывод: серверные контроллеры, Form Request и ресурсы пишем руками (это и так тонкий слой по требованиям GLOSSARY: четыре сущности, без аккаунтов), а совпадение с контрактом проверяем тестами.

### Контрактные тесты: что подходит под Laravel 13

| Пакет | Версия | Ограничения (Packagist) | Заметки |
| --- | --- | --- | --- |
| `hotmeteor/spectator` | v3.0.4 (2026-08-23) | `php ^8.3`, `laravel/framework >=12.0` | Хелперы для HTTP-тестов Laravel (`assertValidRequest`, `assertValidResponse`), парсит схему через `cebe/php-openapi`. Разработка на PHPUnit ^11, работа с Pest 5 не проверялась |
| `kirschbaum-development/laravel-openapi-validator` | 2.0.2 (2026-06-16) | `illuminate/support ^13` допускается, `league/openapi-psr7-validator` до 0.24 | Проверяет все запросы и ответы в HTTP-тестах автоматически через трейт |
| `league/openapi-psr7-validator` | 0.24 (2026-05-08) | PHP >=7.2 | Описание пакета: «OpenAPI (3.0.2) specifications», 3.1 не заявлена |

Источники: [Spectator на Packagist](https://repo.packagist.org/p2/hotmeteor/spectator.json), [README Spectator](https://github.com/hotmeteor/spectator), [kirschbaum на Packagist](https://repo.packagist.org/p2/kirschbaum-development/laravel-openapi-validator.json), [league/openapi-psr7-validator](https://github.com/thephpleague/openapi-psr7-validator).

Из-за `league/openapi-psr7-validator` (только 3.0.x) эмиттеру оставляем `openapi-versions: 3.0.0`, это же значение по умолчанию. Для Spectator поддержка 3.1 в его README не заявлена, поэтому в 3.0 тоже безопаснее. Если позже понадобится 3.1, нужно сначала проверить выбранный валидатор.

Совместимость выбранного PHP-пакета с Pest 5 и Laravel 13 в проекте не проверялась (по условию зависимости не меняем), это первое, что нужно проверить при внедрении.

## 4. Одна команда и проверка актуальности

Предлагаемая структура (новые базовые папки требуют согласования с владельцем проекта, так как правила запрещают их создавать без одобрения):

- `contract/` с `main.tsp`, `tspconfig.yaml`, выход `contract/openapi.yaml` (коммитится);
- `openapi-ts.config.ts` в корне, выход `resources/js/api/` (коммитится).

Скрипты `package.json` (имена предложены, не проверялись в проекте):

```json
"contract:build": "tsp compile contract",
"contract:sdk": "openapi-ts",
"contract:generate": "npm run contract:build && npm run contract:sdk",
"contract:check": "npm run contract:generate && git diff --exit-code -- contract/openapi.yaml resources/js/api"
```

Для `git diff --exit-code` свежесгенерированные файлы должны уже быть в индексе или закоммичены, а новые (untracked) файлы diff не покажет. Надёжнее: `git status --porcelain -- contract resources/js/api` и падение, если вывод непустой.

Дополнительно:

- `tsp compile contract --no-emit --warn-as-error` как быстрая проверка самого контракта.
- В `composer.json` в `ci:check` добавить `npm run contract:check` перед `npm run types:check`, чтобы устаревший SDK не доходил до типизации. CI запускает ту же команду, отдельного шага не нужно.
- Решение по Git: коммитить `openapi.yaml` и SDK (в отличие от Wayfinder, который лежит в `.gitignore`). Плюс: изменение контракта видно в диффе, фронтенд собирается без запуска Node-генераторов. Минус: два дополнительных набора файлов в каждом PR, их проверяет `contract:check`. Альтернатива «SDK не коммитим, генерируем в `composer setup` и `npm run build`» проще, но ломает проверку актуальности.
- Закрепить точные версии (`@typespec/*` 1.17.0, `@hey-api/openapi-ts` 0.99.0 без `^`): hey-api 0.x меняет вывод между минорными версиями (см. выше), TypeSpec для 1.x эмиттеров ожидает совпадения `compiler`, `http`, `openapi3` по минорной версии.

## 5. Риски

1. `@hey-api/openapi-ts` 0.x: возможны ломающие изменения и дрейф вывода между версиями. Смягчение: точная версия, обновление отдельным PR, `contract:check` в CI.
2. Требование `node >=22.18` у hey-api и orval при `engines: ">=22"` проекта и локальной Node 22.17.1 (Herd). Работает с предупреждениями, но формально не поддерживается. Смягчение: поднять `engines` до `>=22.18` и `.nvmrc` до конкретной 22.x или принять предупреждения.
3. TypeScript 7 как peer-зависимость hey-api ломает его (проверено), проект на 5.9.3 не должен обновляться до 7 без проверки.
4. Нет серверного генератора под Laravel 13: контракт и Laravel-код могут разойтись. Смягчение: контрактные тесты на каждый эндпоинт (Spectator или kirschbaum), дубли правил валидации живут в Form Request.
5. PHP-валидаторы понимают OpenAPI 3.0.x: ограничивает набор возможностей TypeSpec (например, `3.1`-специфичная `const`, `type: [..., null]`).
6. Совместимость Spectator и kirschbaum-пакета с Pest 5 не проверена.
7. Сгенерированный SDK придётся исключить из `vp check` (lint и fmt), иначе `npm run check` упадёт на чужом форматировании.
8. Новые базовые папки (`contract/`) и новые зависимости требуют согласования по правилам проекта.

## Источники

- [TypeSpec: OpenAPI 3 emitter, опции](https://typespec.io/docs/emitters/openapi3/reference/emitter/)
- [TypeSpec: CLI](https://typespec.io/docs/handbook/cli/)
- [TypeSpec: исходник флагов `tsp compile`](https://github.com/microsoft/typespec/blob/main/packages/compiler/src/core/cli/actions/compile/args.ts)
- [TypeSpec: клиентские эмиттеры](https://typespec.io/docs/emitters/clients/introduction/)
- [TypeSpec: каталог серверных эмиттеров](https://github.com/microsoft/typespec/tree/main/website/src/content/docs/docs/emitters/servers)
- [Hey API: get started](https://heyapi.dev/openapi-ts/get-started), [fetch client](https://heyapi.dev/openapi-ts/clients/fetch), [output](https://heyapi.dev/openapi-ts/configuration/output)
- npm registry: [@typespec/compiler](https://registry.npmjs.org/@typespec/compiler/latest), [@typespec/openapi3](https://registry.npmjs.org/@typespec/openapi3/latest), [@hey-api/openapi-ts](https://registry.npmjs.org/@hey-api/openapi-ts/latest), [orval](https://registry.npmjs.org/orval/latest), [openapi-typescript](https://registry.npmjs.org/openapi-typescript/latest), [openapi-fetch](https://registry.npmjs.org/openapi-fetch/latest), [@openapitools/openapi-generator-cli](https://registry.npmjs.org/@openapitools/openapi-generator-cli/latest)
- OpenAPI Generator: [php-laravel](https://openapi-generator.tech/docs/generators/php-laravel/)
- Packagist: [hotmeteor/spectator](https://repo.packagist.org/p2/hotmeteor/spectator.json), [kirschbaum-development/laravel-openapi-validator](https://repo.packagist.org/p2/kirschbaum-development/laravel-openapi-validator.json), [ensi/laravel-openapi-server-generator](https://repo.packagist.org/p2/ensi/laravel-openapi-server-generator.json), [league/openapi-psr7-validator](https://repo.packagist.org/p2/league/openapi-psr7-validator.json)
- GitHub: [thephpleague/openapi-psr7-validator](https://github.com/thephpleague/openapi-psr7-validator), [hotmeteor/spectator](https://github.com/hotmeteor/spectator), [ensi-platform/laravel-openapi-server-generator](https://github.com/ensi-platform/laravel-openapi-server-generator)
- Файлы проекта: `package.json`, `composer.json`, `composer.lock`, `vite.config.ts`, `.nvmrc`, `docs/adr/0001-inertia-pages-sdk-data.md`
