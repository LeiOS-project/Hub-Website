/**
 * useRuntimeAppConfigs — typed access to publicRuntimeConfig.
 *
 * `nuxt.config.ts` exposes `apiUrl` (the full API-Server base URL, including the version
 * prefix) and `appUrl` under `runtimeConfig.public`. This composable wraps them with safe
 * fallbacks for SSR and client.
 * Whether signup is open comes from the API (`GET /v1/meta`), not from config.
 * See docs/05-api-contract.md and docs/07-state-and-data.md.
 */
export function useRuntimeAppConfigs() {
	const config = useRuntimeConfig();
	return {
		apiUrl: (config.public.apiUrl as string | undefined) ?? "",
		appUrl: (config.public.appUrl as string | undefined) ?? "",
	} as const;
}
