# Project Workflow

- Run `composer ci:check` as the final gate before declaring work done. It chains the Vite+ lint and format check, `tsc`, Pint, Larastan, and Pest, and CI runs the same command.
- While working, run the narrow checks: `php artisan test --compact <path>` for tests, `vendor/bin/pint --dirty --format agent` for PHP style, `npm run check:fix` for TS/React lint and format.
- Frontend tooling is Vite+ (`vp`) configured in `vite.config.ts`, not plain Vite.
- Specs and tickets for the current work live in `.scratch/`.
