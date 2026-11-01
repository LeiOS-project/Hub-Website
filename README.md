# LeiOS Repository Hub

Central control center for LeiOS packages: public explorer, developer workflows, and admin approvals.
The Hub is the web frontend of the LeiOS API-Server, which it talks to over HTTP.

## Features

- 🔍 Public package explorer (search, sort, stable/testing filter), package pages with install
  commands and release history, publisher profiles with verified badges, and the OS release log
- 📝 Self-service signup with email confirmation (when the API-Server enables it)
- 🛠️ Developer workspace to create packages, upload amd64/arm64 releases, and request promotion to stable
- 🏢 Publisher management with member roles, per-package role overrides and ownership transfer
- 🛡️ Admin area: overview, user moderation (suspend, reset links, sign-out everywhere), publisher
  verification, hiding/deprecating packages, user reports, audit log, stable promotion reviews,
  OS releases and tasks with logs
- 🔑 Personal API keys for scripts and CI
- 🔐 Session-based authentication with automatic API client configuration

## Tech Stack

- Framework: Nuxt 4 (SSR for public pages, client-rendered dashboard)
- UI: Nuxt UI v4 + Lucide icons, Tailwind CSS v4 (dark-only)
- Language: TypeScript
- Runtime: Bun (`nuxt build --preset bun`)
- API client: generated with `@hey-api/openapi-ts` from the API-Server's OpenAPI spec
- Tooling: Biome (format + lint), `bun test`

The code follows the [LeiCraftMC Style Guide](https://git.leicraftmc.de/LeiCraftMC/Style-Guides).

## Quick start

1. Install dependencies

   ```bash
   bun install
   ```

2. Environment variables — copy `example.env` to `.env` and adjust as needed:

   - `LEIOS_HUB_API_URL` — origin of the LeiOS API-Server, without `/v1` (default `http://localhost:12151`)
   - `LEIOS_HUB_APP_URL` — public URL of the Hub (default `http://localhost:12153`)

   Signup is switched on in the API-Server (`LRA_SIGNUP_ENABLED` plus SMTP); the Hub reads it from
   `GET /v1/meta`.

3. Development server (port `12153`)

   ```bash
   bun run dev
   ```

4. Regenerate the typed API client (the API-Server must be running on port `12151` with docs enabled)

   ```bash
   bun run api-client:generate
   ```

5. Production build & start

   ```bash
   bun run build
   bun run start
   ```

## Scripts

| Script | Purpose |
| --- | --- |
| `bun run dev` | Dev server on port 12153 |
| `bun run build` / `bun run start` | Production build (Bun preset) and server on port 12153 |
| `bun run typecheck` | `nuxt typecheck` + `tsc` for the tests |
| `bun run check:ci` / `bun run format` | Biome check (CI gate) / format |
| `bun test` / `bun run test:ci` | Tests / tests with coverage and a JUnit report |
| `bun run api-client:generate` | Regenerate `app/api-client/` |

## Deployment

CI (`.gitlab-ci.yml`) runs lint, typecheck and tests on every push and merge request; on the
default branch it builds `.output/` and pushes the Docker image (`docker/Dockerfile`). Run it with
`docker/docker-compose.yml`, setting `LEIOS_HUB_API_URL` and `LEIOS_HUB_APP_URL` for the
deployment.

## AI tooling

- `AGENTS.md` (all agents) and `CLAUDE.md` (Claude Code) describe the repo conventions.
- Claude Code commands and MCP servers: `.claude/settings.json`; VS Code MCP: `.vscode/mcp.json`.
- OpenCode: `opencode.json` and `.opencode/commands/` (`/verify`, `/dev`, `/api-client`).

## License

AGPL-3.0 — see `LICENSE` for details.

## Support

- Email: support@leios.dev
- Discord: https://discord.gg/8YC5BXjCc5
- GitHub: https://github.com/LeiOS-project
