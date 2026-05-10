---
description: Regenerate the typed API client
agent: build
---
Regenerate and verify the generated API client for this project.

Use the repo constraints from `AGENTS.md`.

1. Run `bun run api-client:generate`.
2. Do not hand-edit generated `*.gen.ts` files.
3. If generation fails, diagnose whether the local backend or OpenAPI endpoint is the issue.
4. Summarize the outcome and any follow-up needed.
