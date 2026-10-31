<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { useUserInfoStore } from "~/composables/stores/useUserStore";

// The LeiOS logo links to the project site; "/ Hub" links to the Hub's home page.
const LEIOS_WEBSITE_URL = "https://www.leios.dev";

const route = useRoute();
const user = await useUserInfoStore().use();

const links = computed<NavigationMenuItem[]>(() => [
	{ label: "Home", to: "/" },
	{ label: "Explore", to: "/explore" },
	{ label: "Publishers", to: "/publishers" },
	{ label: "Releases", to: "/releases" },
	{ label: "Dashboard", to: "/dashboard" },
]);

const profileLabel = computed(() => user.value?.display_name || user.value?.username || "Profile");

const loginRoute = computed(() =>
	route.path.startsWith("/auth")
		? "/auth/login"
		: `/auth/login?url=${encodeURIComponent(route.fullPath)}`,
);
</script>

<template>
	<UHeader class="backdrop-blur-xl">
		<template #left>
			<div class="flex items-center gap-2">
				<NuxtLink :to="LEIOS_WEBSITE_URL" target="_blank" aria-label="LeiOS website">
					<ImgLeiOSLogo class="h-8 w-auto" />
				</NuxtLink>
				<NuxtLink to="/" class="flex items-center gap-2 text-2xl leading-none font-bold">
					<span>/</span>
					<span>Hub</span>
				</NuxtLink>
			</div>
		</template>

		<UNavigationMenu :items="links" />

		<template #body>
			<UNavigationMenu :items="links" orientation="vertical" class="w-full" />

			<HubMetaProvider v-if="!user" v-slot="{ signupEnabled }">
				<UButton
					v-if="signupEnabled"
					icon="i-lucide-user-plus"
					to="/auth/signup"
					color="primary"
					variant="solid"
					block
					class="mt-4 sm:hidden"
				>
					Sign up
				</UButton>
			</HubMetaProvider>
		</template>

		<template #right>
			<div class="flex items-center gap-2">
				<template v-if="user">
					<div class="hidden items-center gap-1.5 text-white sm:flex">
						<UIcon name="i-lucide-user" class="size-4" />
						<span class="text-sm">{{ profileLabel }}</span>
					</div>
					<UButton
						icon="i-lucide-layout-dashboard"
						to="/dashboard"
						color="primary"
						variant="soft"
						class="hidden sm:flex"
					>
						Dashboard
					</UButton>
				</template>

				<HubMetaProvider v-else v-slot="{ signupEnabled }">
					<UButton
						icon="i-lucide-log-in"
						:to="loginRoute"
						:color="signupEnabled ? 'neutral' : 'primary'"
						:variant="signupEnabled ? 'ghost' : 'solid'"
					>
						Log in
					</UButton>
					<!-- Below `sm` the sign-up button moves into the mobile menu (#body). -->
					<UButton
						v-if="signupEnabled"
						icon="i-lucide-user-plus"
						to="/auth/signup"
						color="primary"
						variant="solid"
						class="max-sm:hidden"
					>
						Sign up
					</UButton>
				</HubMetaProvider>
			</div>
		</template>
	</UHeader>
</template>
