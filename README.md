# Minimal React + TypeScript + Vite + Tailwind Template

## Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS v4
- ESLint + Prettier
- Husky + lint-staged + commitlint
- GitHub Actions CI (`lint`, `typecheck`, `build`)

## Requirements

- Node.js 22 (see [.nvmrc](.nvmrc))

## Getting started

```sh
npm install
npm run dev
```

## Scripts

| Command                | Description                  |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Start dev server             |
| `npm run build`        | Typecheck + production build |
| `npm run typecheck`    | TypeScript check only        |
| `npm run lint`         | Lint (zero warnings)         |
| `npm run lint:fix`     | Lint and auto-fix            |
| `npm run format`       | Format with Prettier         |
| `npm run format:check` | Check formatting             |
| `npm run preview`      | Preview production build     |

## Tailwind CSS

Tailwind CSS v4 is enabled via the Vite plugin and imported in
[src/index.css](src/index.css).

## Extending for NestJS backends

This template intentionally does not include a preselected API client, router,
or state manager. For a Vite + React + NestJS stack, add those only after your
domain and integration requirements are clear (auth flow, caching model, API
error contract, and route strategy).
