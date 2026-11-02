<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { useUserInfoStore } from "~/composables/stores/useUserStore";

const userInfoStore = useUserInfoStore();
const user = await userInfoStore.use();

const isAdmin = computed(() => user.value?.role === "admin");

const sidebarItems = computed(() => {
	const devItems: NavigationMenuItem[] = [
		{
			label: "Overview",
			icon: "i-lucide-layout-dashboard",
			to: "/dashboard",
			exact: true,
		},
		{
			label: "Packages",
			icon: "i-lucide-package",
			to: "/dashboard/packages",
		},
		{
			label: "Publishers",
			icon: "i-lucide-building",
			to: "/dashboard/publishers",
		},
		{
			label: "API Keys",
			icon: "i-lucide-key",
			to: "/dashboard/apikeys",
		},
	];

	const adminItems: NavigationMenuItem[] = [
		{
			label: "Admin",
			icon: "i-lucide-shield",
			type: "label",
			// defaultOpen: route.path.startsWith("/dashboard/admin"),
			// children: [
			//     {
			//         label: "Stable Promotion Requests",
			//         to: "/dashboard/admin/stable-promotion-requests",
			//     },
			//     {
			//         label: "Users",
			//         to: "/dashboard/admin/users",
			//     },
			//     {
			//         label: "All Packages",
			//         to: "/dashboard/admin/packages",
			//     },
			// ],
		},
		{
			label: "Overview",
			icon: "i-lucide-gauge",
			to: "/dashboard/admin",
			exact: true,
		},
		{
			label: "Users",
			icon: "i-lucide-users",
			to: "/dashboard/admin/users",
		},
		{
			label: "Publishers",
			icon: "i-lucide-building-2",
			to: "/dashboard/admin/publishers",
		},
		{
			label: "All Packages",
			icon: "i-lucide-package-search",
			to: "/dashboard/admin/packages",
		},
		{
			label: "Reports",
			icon: "i-lucide-flag",
			to: "/dashboard/admin/reports",
		},
		{
			label: "Stable Promotion Requests",
			icon: "i-lucide-git-pull-request",
			to: "/dashboard/admin/stable-promotion-requests",
		},
		{
			label: "OS Releases",
			icon: "i-lucide-rocket",
			to: "/dashboard/admin/os-releases",
		},
		{
			label: "Tasks",
			icon: "i-lucide-list-checks",
			to: "/dashboard/admin/tasks",
		},
		{
			label: "Audit Log",
			icon: "i-lucide-scroll-text",
			to: "/dashboard/admin/audit-log",
		},
	];

	const settings: NavigationMenuItem[] = [
		{
			label: "Settings",
			icon: "i-lucide-settings",
			type: "label",
		},
		{
			label: "General",
			icon: "i-lucide-user",
			to: "/dashboard/settings",
			exact: true,
		},
		{
			label: "Security",
			icon: "i-lucide-shield",
			to: "/dashboard/settings/security",
		},
	];

	const footerItems: NavigationMenuItem[] = [
		{
			label: "Explorer",
			icon: "i-lucide-compass",
			to: "/explore",
		},
		{
			label: "Back to Home",
			icon: "i-lucide-home",
			to: "/",
		},
	];

	return {
		dev: devItems,
		settings: settings,
		admin: adminItems,
		footer: footerItems,
	};
});
</script>

<template>
    <NuxtLoadingIndicator color="var(--ui-primary)" position="top" />

    <UDashboardGroup class="main-bg-color text-slate-100">
        <UDashboardSidebar
            collapsible
            resizable
            :ui="{
                header: 'main-bg-color',
                body: 'main-bg-color',
                content: 'main-bg-color',
                footer: 'border-t border-default main-bg-color',
            }"
            :min-size="18"
            :default-size="20"
            :max-size="30"
        >
            <template #header="{ collapsed }">
                <NuxtLink to="/" :class="`${!collapsed ? 'ms-2.5' : ''} flex items-center gap-1.5`">
                    <ImgLeiOSLogo v-if="!collapsed" class="h-6 w-auto flex-none" />
                    <span v-if="!collapsed" class="text-lg font-semibold">/</span>
                    <span v-if="!collapsed" class="text-lg font-semibold">Hub</span>
                    <ImgLeiOSIcon v-else class="h-8 w-8" />
                </NuxtLink>
            </template>

            <template #default="{ collapsed }">
                <UNavigationMenu
                    :collapsed="collapsed"
                    :items="sidebarItems.dev"
                    orientation="vertical"
                />

                <UNavigationMenu
                    v-if="isAdmin"
                    :collapsed="collapsed"
                    :items="sidebarItems.admin"
                    orientation="vertical"
                />

                <UNavigationMenu
                    :collapsed="collapsed"
                    :items="sidebarItems.settings"
                    orientation="vertical"
                />

                <UNavigationMenu
                    :collapsed="collapsed"
                    :items="sidebarItems.footer"
                    orientation="vertical"
                    class="mt-auto"
                />
            </template>

            <template #footer="{ collapsed }">
                <DashboardUserMenu :collapsed="collapsed" />
            </template>
        </UDashboardSidebar>

        <slot />
    </UDashboardGroup>
</template>

