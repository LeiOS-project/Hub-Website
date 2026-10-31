# AGENTS.md — operating manual for AI coding agents

You are working in the **LeiOS Hub** (`hub.leios.dev`), a Nuxt 4 app on Bun. It is frontend only:
the backend is the separate LeiOS API-Server repo (the style guide's "split-repo" nuxt-app shape).
Follow the LeiCraftMC Style Guide: https://git.leicraftmc.de/LeiCraftMC/Style-Guides.

## Must read

- [docs/00-overview.md](https://git.leicraftmc.de/LeiCraftMC/Style-Guides/-/blob/main/docs/00-overview.md)
- [docs/01-project-structure.md](https://git.leicraftmc.de/LeiCraftMC/Style-Guides/-/blob/main/docs/01-project-structure.md) — split-repo shape
- [docs/06-frontend-nuxt.md](https://git.leicraftmc.de/LeiCraftMC/Style-Guides/-/blob/main/docs/06-frontend-nuxt.md)
- [docs/07-state-and-data.md](https://git.leicraftmc.de/LeiCraftMC/Style-Guides/-/blob/main/docs/07-state-and-data.md)
- [docs/10-auth.md](https://git.leicraftmc.de/LeiCraftMC/Style-Guides/-/blob/main/docs/10-auth.md) — frontend session handling
- [docs/15-design-system.md](https://git.leicraftmc.de/LeiCraftMC/Style-Guides/-/blob/main/docs/15-design-system.md)

## Non-negotiable

- Nuxt 4 `app/` srcDir. Tailwind v4 CSS-first; no `tailwind.config.js`. Dark-only (no toggle).
- All API access through `useAPI` (wraps the generated SDK); no raw `$fetch`/`useFetch`.
- Global state via `AbstractStore` over `useState`; component-local form/UI state with
  `reactive()`/`ref()` is fine.
- Session cookie only via `useAppCookies()`; `useAPI` redirects on any `code === 401`.
- Lucide icons only (`i-lucide-*`). Never hand-edit `*.gen.ts` under `app/api-client/` —
  regenerate with `bun run api-client:generate`.
- Format with Biome before finishing (`bun run check:ci` must report no errors). Conventional
  Commits.
- Before declaring done: `bun run typecheck`, `bun run check:ci` and `bun test` pass; for `.vue`
  changes also `bun run build`.

## Hub-specific notes

- **Ports:** the Hub runs on **12153** (dev and prod); the API-Server on **12151**.
- **Env vars** (`example.env`; the Nitro banner in `nuxt.config.ts` maps them onto `NUXT_PUBLIC_*`
  at server start, so a built `.output/` is configured at runtime):
  - `LEIOS_HUB_API_URL` — API-Server origin **without** `/v1` (default `http://localhost:12151`;
    `updateAPIClient` appends `/v1`).
  - `LEIOS_HUB_APP_URL` — public URL of the Hub (default `http://localhost:12153`).
- **Signup** has no Hub switch: the Hub reads `signup_enabled` from the API's `GET /v1/meta`
  (`HubMetaProvider` in `app/components/hub/`) and shows or hides the signup page and links. The
  API-Server opens signup with `LRA_SIGNUP_ENABLED` plus a working SMTP setup.
- **Session cookie:** `lra_session_token` — matches the API's `lra_` token prefix
  (`lra_sess_…`, `lra_apikey_…`).
- **Routing:** `/dashboard/**` and `/auth/**` render client-side (`routeRules` in `nuxt.config.ts`);
  `/` and `/explore/**` are SSR and public. Access rules are the constants in
  `app/middleware/auth.global.ts` (onboarding is off — the Hub has none yet).
- **Roles:** users are `admin` / `developer` / `user` (`getRoleColor` in `app/utils/roles.ts`).
  Package and publisher permissions are enforced by the API-Server.
- **Package names:** a package's `fullname` is `<publisherName>.<packageName>`; publisher names
  never contain dots.
- **API client:** start the API-Server locally on 12151 with its docs enabled, then run
  `bun run api-client:generate` (openapi-ts reads `http://localhost:12151/docs/v1/openapi`, then
  `scripts/patch-api-client.ts` adds `// @ts-nocheck` to the generated `sdk.gen.ts` and
  `client/client.gen.ts`). Commit the regenerated `app/api-client/`.
- **Typecheck:** with vue-tsc 3.3.14 `bun run typecheck` does check `.vue` files. Write inline
  click handlers as statements (`@click="open = true;"` — Nuxt UI's `onClick` must return void),
  and keep `//` out of static component attributes (put URLs in a `<script>` constant): vue-tsc
  mangles them and breaks the rest of the template's check.
