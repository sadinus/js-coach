# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start dev server on port 3000
- `npm run build` — production build (`vite build`)
- `npm run preview` — preview the production build
- `npm run test` — run Vitest once (`vitest run`); for a single file: `npx vitest run src/path/to/file.test.tsx`; watch mode: `npx vitest`
- `npm run check` — Biome lint + format check (run before considering work done)
- `npm run lint` / `npm run format` — Biome lint-only / format-only
- `npm run generate-routes` — regenerate `src/routeTree.gen.ts` from the files in `src/routes` (usually unnecessary; the Vite plugin regenerates it automatically while `dev`/`build` run)

## Architecture

This is a **TanStack Start** app (full-stack React 19 framework on Vite) using **file-based routing** via TanStack Router.

- **Routing is file-based.** Files in `src/routes` map to routes. Each route file exports a `Route` created with `createFileRoute('/path')(...)`; the root layout lives in `src/routes/__root.tsx` (exports `createRootRoute`, renders the HTML shell via `shellComponent`). Adding/removing a route file regenerates `src/routeTree.gen.ts` — **this file is generated, never edit it by hand** (also excluded from Biome).
- `src/router.tsx` wires the generated `routeTree` into the router via `getRouter()` and registers the router type globally for type-safe navigation.
- **Server functions** (`createServerFn` from `@tanstack/react-start`) and **API routes** (the `server.handlers` property on a file route) let route files run server-side code. Route `loader`s fetch data before render (`Route.useLoaderData()`).
- The Vite plugin stack (`vite.config.ts`) is order-sensitive: `devtools()`, `tailwindcss()`, `tanstackStart()`, `viteReact()`.

## Conventions

- **Imports:** use the `#/*` or `@/*` alias for `src/*` (e.g. `import x from "#/router"`).
- **Formatting (Biome):** tab indentation, double quotes. Biome only lints `src/**`, `.vscode/**`, `index.html`, and `vite.config.ts`; `routeTree.gen.ts` and `styles.css` are excluded.
- **Styling:** Tailwind CSS v4, imported in `src/styles.css` and loaded as a stylesheet link in `__root.tsx`. Tailwind is configured through the `@tailwindcss/vite` plugin (no `tailwind.config.js`).
- **TypeScript** is strict with `noUnusedLocals`/`noUnusedParameters`; `noEmit` (Vite handles transpilation). `verbatimModuleSyntax` is on, so use `import type` for type-only imports.
- Files prefixed with `demo` are scaffold examples and safe to delete.
