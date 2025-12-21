<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { UserStore } from '~/utils/stores/userStore'
import LeiOSLogo from '../img/LeiOSLogo.vue';

const route = useRoute()
const sessionCookie = useCookie<string | null>('session_token')
const user = ref<any | null>(null)

if (sessionCookie.value) {
    user.value = await UserStore.use().catch(() => null)
}

const links = computed<NavigationMenuItem[]>(() => [
    {
        label: 'Home',
        to: '/'
    },
    {
        label: 'Explorer',
        to: '/explore'
    },
    {
        label: 'Dashboard',
        to: '/dashboard'
    }
])

const isAuthenticated = computed(() => Boolean(sessionCookie.value))

const profileLabel = computed(() => {
    if (user.value?.display_name) return user.value.display_name
    if (user.value?.username) return user.value.username
    return 'Profile'
})

const redirectQuery = computed(() => encodeURIComponent(route.fullPath))
</script>

<template>
    <UHeader class="backdrop-blur-xl">
        <template #left>
            <div class="flex items-center gap-2">
                <NuxtLink to="https://www.leios.dev">
                    <LeiOSLogo class="h-8 w-auto" />
                </NuxtLink>
                <NuxtLink to="/" class="flex items-center gap-2 text-2xl font-bold leading-none">
                    <span>/</span>
                    <span>Hub</span>
                </NuxtLink>
                <!-- <NuxtLink to="/" class="flex items-center gap-1.5">
                    <LeiOSLogo v-if="!collapsed" class="ms-2.5 h-6 w-auto flex-none" />
                    <span v-if="!collapsed" class="text-lg font-semibold">/</span>
                    <span v-if="!collapsed" class="text-lg font-semibold">Hub</span>
                    <LeiOSIcon v-else class="h-8 w-8" />
                </NuxtLink> -->
            </div>
        </template>

        <UNavigationMenu :items="links" />

        <template #body>
            <UNavigationMenu :items="links" orientation="vertical" class="w-full" />
        </template>

        <template #right>
            <div class="flex items-center gap-2">
                <template v-if="isAuthenticated">
                    <div class="hidden sm:flex items-center gap-1.5 text-white">
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

                <UButton v-else icon="i-lucide-log-in" :to="`/auth/login?url=${redirectQuery}`" color="primary"
                    variant="solid" class="">
                    Login
                </UButton>
            </div>
        </template>
    </UHeader>
</template>
