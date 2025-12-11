# LeiOS Repository Hub

Central control center for LeiOS packages: public explorer, developer workflows, and admin approvals.

## Features

- 🔍 Public package explorer with search, repo filters (archive/testing/stable), and release tables
- 🛠️ Developer workspace to create packages, upload amd64/arm64 releases, and request promotion to stable
- 🛡️ Admin controls for approving/denying stable requests and managing users/roles
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
- `DEV_PROXY_TARGET` — proxy target when `USE_DEV_PROXY=true` (defaults to `https://api.repo.leios.dev`)

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

## Project structure

```
app/
├── api-client/              # Generated SDK (openapi-ts)
├── app.config.ts            # Nuxt app config
├── assets/css/main.css      # Global styles & theme tokens
├── components/
│   ├── img/                 # Brand assets (LeiOS icon/logo)
│   └── layout/              # Header & footer
├── composables/
│   ├── updateAPIClient.ts   # Sets API base URL + auth header
│   ├── useAPI.ts            # Wrapper that injects session token & redirects to login
│   └── useRepository.ts     # Placeholder helpers for repository calls
├── layouts/default.vue      # Site shell
├── middleware/
│   ├── auth.global.ts       # Redirects unauthenticated users
│   └── rewrites.global.ts   # Rewrites support
├── pages/
│   ├── index.vue            # Landing page
│   ├── auth/
│   │   ├── login.vue        # Session login
│   │   └── password-reset.vue
│   ├── dashboard/index.vue  # Developer/Admin dashboard
│   └── explorer/
│       ├── index.vue        # Public package list
│       └── [packageName].vue  # Package detail & releases
└── utils/
    ├── index.ts             # Utilities (formatting, helpers)
    └── stores/userStore.ts  # Session store
```

## Key pages & flows

- `/` Landing: highlights roles, CTA to explorer/login, Nuxt UI hero.
- `/explorer`: public package list with search, refresh, and links to package detail.
- `/explorer/:packageName`: repo filter (all/archive/testing/stable) plus releases table per arch.
- `/dashboard`: tabbed developer/admin workspace.
  - Developer: create packages, upload releases, view releases & stable requests.
  - Admin: review/approve/deny stable requests, create users, manage roles.
- `/auth/login`: sets `session_token` cookie and redirects to dashboard or a requested URL.
- `/auth/password-reset`: change password for the signed-in user; unauthenticated users are prompted to log in.

## Authentication & API client

- Session token is stored in the `session_token` cookie.
- `useAPI` injects the token into the generated client; when missing (client-side) it redirects to `/auth/login` unless `disableAuthRedirect` is true.
- `updateAPIClient` sets the base URL from `runtimeConfig.public.apiUrl` and attaches `Authorization: Bearer <token>` when present.
- Dev proxy can be toggled via `USE_DEV_PROXY=true` to forward `/api/proxy` to `DEV_PROXY_TARGET` during local development.

## Styling

- Dark-forward UI using @nuxt/ui components and the Aurora-inspired palette defined in `assets/css/main.css`.
- Tailwind utilities layered with custom CSS variables (`--surface-*`, `--text-*`) for consistent surfaces and text contrast.

## License

GPL License — see `LICENSE` for details.

## Support

- Email: support@leios.dev
- Discord: https://discord.gg/8YC5BXjCc5
- GitHub: https://github.com/LeiOS-project
