/**
 * useRuntimeAppConfigs — typed access to publicRuntimeConfig.
 *
 * `nuxt.config.ts` exposes `apiUrl` (the API-Server origin, without `/v1`), `appUrl` and the
 * LeiOS-specific `isSignupEnabled` under `runtimeConfig.public`. This composable wraps them with
 * safe fallbacks for SSR and client. See docs/05-api-contract.md and docs/07-state-and-data.md.
 */
export function useRuntimeAppConfigs() {
	const config = useRuntimeConfig();
	return {
		apiUrl: (config.public.apiUrl as string | undefined) ?? "",
		appUrl: (config.public.appUrl as string | undefined) ?? "",
		isSignupEnabled: config.public.isSignupEnabled === true,
	} as const;
}
