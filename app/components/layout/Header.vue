<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { UserStore } from '~/utils/stores/userStore'

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
        <template #title>
            <NuxtLink to="/" class="flex items-center gap-2">
                <span class="font-bold text-lg">LeiOS Repository</span>
            </NuxtLink>
        </template>

        <UNavigationMenu :items="links" />

        <template #body>
            <UNavigationMenu :items="links" orientation="vertical" class="w-full" />
        </template>

        <template #right>
            <div class="flex items-center gap-2">
                <UButton v-if="isAuthenticated" icon="i-lucide-layout-dashboard" to="/dashboard" color="primary"
                    variant="soft" class="font-medium hidden sm:inline-flex">
                    Dashboard
                </UButton>

                <UButton v-if="isAuthenticated" icon="i-lucide-user" to="/auth/password-reset" color="neutral"
                    variant="ghost" class="font-medium hidden sm:inline-flex">
                    {{ profileLabel }}
                </UButton>

                <UButton v-else icon="i-lucide-log-in" :to="`/auth/login?url=${redirectQuery}`" color="primary"
                    variant="solid" class="font-medium">
                    Login
                </UButton>
            </div>
        </template>
    </UHeader>
</template>
