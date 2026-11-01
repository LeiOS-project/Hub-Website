# Production image: the Nuxt server bundle (.output/, Bun preset) on the Bun runtime.
# Build it first (CI does this): `bun run build`. .output/ is self-contained — no node_modules.
# Layout: /opt/leios/hub (LeiOS is a standalone product: no org level in the path).
# This shape is stateless: no volumes, and the HEALTHCHECK probes `/` — there is no dedicated
# health route.
# Runtime config comes from the prefixed env, e.g. `-e LEIOS_HUB_API_URL=https://api.leios.dev` —
# the Nitro banner in nuxt.config.ts maps LEIOS_HUB_* onto NUXT_PUBLIC_* at server start.
FROM oven/bun:1-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /opt/leios/hub

COPY ./.output ./app/.output

EXPOSE 12153/tcp

ENV NODE_ENV=production

ENV NITRO_HOST=::
ENV NITRO_PORT=12153

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
	CMD curl -f http://localhost:12153/ || exit 1

CMD ["bun", "run", "/opt/leios/hub/app/.output/server/index.mjs"]
