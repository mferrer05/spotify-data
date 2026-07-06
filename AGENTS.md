# AGENTS.md

Single-app Angular 22 project. Generated with Angular CLI 22.0.5.

## Commands

Package manager is **pnpm** (pinned via `package.json` `packageManager`; `angular.json` also sets `cli.packageManager: pnpm`). Do not use npm or yarn.

- `pnpm start` / `ng serve` — dev server on http://localhost:4200 (development config)
- `pnpm build` / `ng build` — **production** build by default (outputs `dist/`); use `ng build --configuration development` for an unoptimized build
- `pnpm test` / `ng test` — Vitest via `@angular/build:unit-test`
- No `lint`, `typecheck`, or `format` npm scripts are defined.

### Tests (Vitest, not Karma)

- Runner is Vitest 4 (`runner: vitest` default in `angular.json`). Vitest globals (`describe`/`it`/`expect`) are auto-available via `tsconfig.spec.json` `types: ["vitest/globals"]` — do not import them.
- Tests run in **jsdom** (Node env); no browser is configured or required.
- `ng test` is **watch-mode by default in a TTY**. For a single run: `ng test --watch=false`.
- Filter by test name regex: `ng test --filter '^App'`. Include specific globs: `ng test --include "src/app/**"`.
- No external `vitest.config.*` is used (`runnerConfig` defaults to `false`); configure via the `angular.json` test target options instead.

### Lint / format

No ESLint is configured. Prettier config in `.prettierrc`: `printWidth: 100`, single quotes, angular parser for `*.html`. Format with `pnpm exec prettier --write .`. Type errors surface only via `ng build` / `ng test` (there is no separate typecheck step).

## Architecture

- Standalone components + signals; **no NgModules**. Entry: `src/main.ts` → `bootstrapApplication(App, appConfig)`. Root component is `src/app/app.ts` (`app-root`, component prefix `app`).
- Styling: **Tailwind CSS v4** via `@tailwindcss/postcss` (`.postcssrc.json`); there is no `tailwind.config.js`. Global styles `@import 'tailwindcss'` in `src/styles.css`.

## TypeScript constraints

`tsconfig.json` enables strict options an agent is likely to trip on: `noPropertyAccessFromIndexSignature`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, plus Angular's `strictInjectionParameters` and `strictInputAccessModifiers`. Code must satisfy these or the build fails.
