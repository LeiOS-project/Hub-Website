# CLAUDE.md — Claude Code specifics

Read `AGENTS.md` first: it links the LeiCraftMC Style Guide
(https://git.leicraftmc.de/LeiCraftMC/Style-Guides) and lists the Hub-specific notes (ports, env
vars, session cookie, the API-Server relationship). This file adds Claude-Code-specific notes.

## Slash commands

Defined in `.claude/settings.json`:

- `/api-client` — regenerate the typed API client.
- `/verify` — typecheck + tests.
- `/typecheck` — `bun run typecheck` (`nuxt typecheck` + `tsc`).
- `/test` — `bun test`.
- `/dev` — start/inspect the dev setup (port 12153).

## MCP servers

`mcpServers` in `.claude/settings.json` and `.vscode/mcp.json` both register `nuxt` and `nuxt-ui`.
Use them when editing components, composables, or Nuxt UI styling instead of guessing props, slots
or component names.

## API client

Run `bun run api-client:generate` after API-Server route changes (the API-Server must be running
locally on port 12151 with docs enabled). The generated files live in `app/api-client/`.

## Frontend conventions

- Route map and access rules: the constants at the top of `app/middleware/auth.global.ts`.
  Dashboard navigation lives in `app/layouts/dashboard.vue`.
- Reference components by their Nuxt auto-import names (`LayoutHeader`, `ImgLeiOSLogo`,
  `DashboardDataTable`, `DashboardSectionCard`, `FormDateRangePicker`, …). Don't add explicit
  imports that only the `<template>` uses: Biome can't see template usage, reports them as unused,
  and an `--unsafe` fix would delete them.
- If a `<script>` binding is used as a type there and as a value in the `<template>` (e.g. a Zod
  schema for `UForm :schema`), also reference it as a value in `<script>`
  (`const createSchema = zPostPackagesBody`). Otherwise Biome's `useImportType` safe fix turns it
  into `import type` and breaks the page at runtime.
- In `.vue` files, Biome *warnings* about unused variables/imports are expected (template usage).
  Biome *errors* are not.
- Per-user stores live in `app/composables/stores/` (`useUserInfoStore`). Clear them on logout; the
  login page refreshes them for the new session.
- Dashboard pages: `UDashboardPanel` + `DashboardPageHeader` + `DashboardPageBody`; forms in
  `DashboardSectionCard`; destructive actions in a `tone="danger"` card behind
  `DashboardDeleteModal`, whose `onDelete` throws on failure.
