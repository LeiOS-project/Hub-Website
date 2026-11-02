// Nuxt 4 (app/ srcDir is the default). See the LeiCraftMC style guide, docs/06-frontend-nuxt.md.
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	modules: ["@nuxt/ui"],
	colorMode: {
		preference: "dark",
		fallback: "dark",
		classSuffix: "",
	},
	ssr: true,
	css: ["~/assets/css/main.css"],

	nitro: {
		rollupConfig: {
			output: {
				// Map the prefixed env vars onto Nuxt's NUXT_PUBLIC_* overrides at server start, so a
				// built .output/ (e.g. the Docker image) is configured through LEIOS_HUB_* at runtime.
				banner: (() => {
					const mappings = {
						LEIOS_API_URL: "API_URL",
						LEIOS_HUB_APP_URL: "APP_URL",
					};

					const bannerCode = `
						(function () {
							const mappings = ${JSON.stringify(mappings)};
							const env = globalThis.process?.env ?? {};
							for (const [envName, runtimeName] of Object.entries(mappings)) {
								if (!env['NUXT_PUBLIC_' + runtimeName] && env[envName]) {
									env['NUXT_PUBLIC_' + runtimeName] = env[envName];
								}
							}
						})();
					`;

					return bannerCode.replace(/^\s+|\s+$/g, "").replace(/\n\s*/g, " ");
				})(),
			},
		},

		esbuild: {
			options: {
				target: "esnext",
			},
		},
	},

	runtimeConfig: {
		public: {
			// Origin of the LeiOS API-Server, without `/v1` (updateAPIClient appends it).
			apiUrl: process.env.LEIOS_API_URL || "http://localhost:12151",
			appUrl: process.env.LEIOS_HUB_APP_URL || "http://localhost:12153",
		},
	},

	routeRules: {
		"/dashboard/**": { ssr: false },
		"/auth/**": { ssr: false },
		"/**": { ssr: true },
	},

	telemetry: false,
});
