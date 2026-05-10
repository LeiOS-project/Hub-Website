# LeiOS Repository Hub

Central control center for LeiOS packages: public explorer, developer workflows, and admin approvals.

## Features

- 🔍 Public package explorer with search, repo filters (archive/testing/stable), and release tables
- 🛠️ Developer workspace to create packages, upload amd64/arm64 releases, and request promotion to stable
- 🛡️ Admin controls for approving/denying stable promotion requests and managing users/roles
- 🔐 Session-based authentication with automatic API client configuration
- 🎨 Dark Nuxt UI theme using the Aurora-inspired palette

## Tech Stack

- Framework: Nuxt 4 (SSR)
- UI: @nuxt/ui + Lucide icons
- Styling: Tailwind CSS + custom tokens
- Language: TypeScript
- Runtime: Bun (Nitro bun preset)
- API client: Generated via openapi-ts

## Quick start

1) Install dependencies

```bash
bun install
```

2) Environment variables

Copy `example.env` to `.env` and adjust as needed (PowerShell example):

```powershell
Copy-Item example.env .env
```

Key values:

- `REPO_API_URL` — API base URL (defaults to `http://localhost:12151`)
- `USE_DEV_PROXY` — set to `true` to enable the dev proxy in `nuxt.config.ts`
- `DEV_PROXY_TARGET` — proxy target when `USE_DEV_PROXY=true` (defaults to `https://api.leios.dev`)

3) Development server (default port `12153`)

```bash
bun run dev
```

4) Generate the typed API client from the OpenAPI spec

```bash
bun run api-client:generate
```

5) Production build & start

```bash
bun run build
bun start
```

## OpenCode setup

- Project config is checked in at `opencode.json`.
- Project commands live under `.opencode/commands/`.
- Nuxt and Nuxt UI MCP servers are enabled for OpenCode and match the existing VS Code MCP config in `.vscode/mcp.json`.
- Repo instructions for OpenCode live in `AGENTS.md`.

Useful OpenCode commands in this repo:

- `/verify` - run `bun test` and `bun run build`
- `/dev` - work on local dev-server setup
- `/api-client` - regenerate the typed API client


## Styling

- Dark-forward UI using @nuxt/ui components and the Aurora-inspired palette defined in `assets/css/main.css`.
- Tailwind utilities layered with custom CSS variables (`--surface-*`, `--text-*`) for consistent surfaces and text contrast.

## License

GPL License — see `LICENSE` for details.

## Support

- Email: support@leios.dev
- Discord: https://discord.gg/8YC5BXjCc5
- GitHub: https://github.com/LeiOS-project
