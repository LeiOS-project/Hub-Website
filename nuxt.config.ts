// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	modules: ['@nuxt/ui'],

	colorMode: {
		preference: 'dark',
		fallback: 'dark',
		classSuffix: ''
	},

	ssr: true,

	css: [
		'~/assets/css/main.css',
	],

	nitro: {
		preset: 'bun',

		devProxy: process.env.USE_DEV_PROXY === "true" ? {
			"/api/proxy": {
				target: process.env.DEV_PROXY_TARGET || "https://api.repo.leios.dev",
				changeOrigin: true
			}
		} : {}
	},

	runtimeConfig: {
		public: {
			apiUrl: process.env.REPO_API_URL || 'http://localhost:12151',
		}
	},

	vite: {
		server: {
			allowedHosts: [
				"leios-hub-website-test.tun.is-on.net"
			]

		}
	},

	routeRules: {
		"/dashboard/**": { ssr: false },
		"/auth/**": { ssr: false },
		"/**": { ssr: true }
	}
});