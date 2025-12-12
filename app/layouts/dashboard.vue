<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import LeiOSLogo from '~/components/img/LeiOSLogo.vue'
import { UserStore } from '~/utils/stores/userStore'

const route = useRoute()
const sessionCookie = useCookie<string | null>('session_token')
const user = ref<any | null>(null)

if (sessionCookie.value) {
    user.value = await UserStore.use().catch(() => null)
}

const isAdmin = computed(() => user.value?.role === 'admin')

const sidebarItems = computed<NavigationMenuItem[][]>(() => {
    const devItems: NavigationMenuItem[] = [
        {
            label: 'Overview',
            icon: 'i-lucide-layout-dashboard',
            to: '/dashboard'
        },
        {
            label: 'Packages',
            icon: 'i-lucide-package',
            to: '/dashboard/packages'
        },
        {
            label: 'Tasks',
            icon: 'i-lucide-list-checks',
            to: '/dashboard/tasks'
        }
    ]

    const adminItems: NavigationMenuItem[] = isAdmin.value
        ? [
              {
                  label: 'Admin',
                  icon: 'i-lucide-shield',
                  defaultOpen: route.path.startsWith('/dashboard/admin'),
                  children: [
                      { label: 'Stable Requests', to: '/dashboard/admin/requests' },
                      { label: 'Users', to: '/dashboard/admin/users' },
                      { label: 'All Packages', to: '/dashboard/admin/packages' }
                  ]
              }
          ]
        : []

    const footerItems: NavigationMenuItem[] = [
        {
            label: 'Explorer',
            icon: 'i-lucide-compass',
            to: '/explorer'
        },
        {
            label: 'Back to Home',
            icon: 'i-lucide-home',
            to: '/'
        }
    ]

    return [[...devItems, ...adminItems], footerItems]
})

const profileLabel = computed(() => {
    if (user.value?.display_name) return user.value.display_name
    if (user.value?.username) return user.value.username
    return 'Profile'
})
</script>

<template>
    <UDashboardGroup>
        <UDashboardSidebar
            collapsible
            resizable
            :ui="{ footer: 'border-t border-default' }"
        >
            <template #header="{ collapsed }">
                <NuxtLink to="/" class="flex items-center gap-2">
                    <LeiOSLogo v-if="!collapsed" class="h-6 w-auto" />
                    <UIcon v-else name="i-lucide-box" class="size-5 text-primary mx-auto" />
                    <span v-if="!collapsed" class="text-lg font-semibold">/ Hub</span>
                </NuxtLink>
            </template>

            <template #default="{ collapsed }">
                <UNavigationMenu
                    :collapsed="collapsed"
                    :items="sidebarItems[0]"
                    orientation="vertical"
                />

                <UNavigationMenu
                    :collapsed="collapsed"
                    :items="sidebarItems[1]"
                    orientation="vertical"
                    class="mt-auto"
                />
            </template>

            <template #footer="{ collapsed }">
                <UDropdownMenu
                    :items="[
                        [
                            { label: 'Account Settings', icon: 'i-lucide-settings', to: '/dashboard/settings' },
                            { label: 'Change Password', icon: 'i-lucide-key', to: '/auth/password-reset' }
                        ],
                        [
                            { label: 'Logout', icon: 'i-lucide-log-out', to: '/auth/logout' }
                        ]
                    ]"
                >
                    <UButton
                        :avatar="{ icon: 'i-lucide-user' }"
                        :label="collapsed ? undefined : profileLabel"
                        color="neutral"
                        variant="ghost"
                        class="w-full"
                        :block="collapsed"
                    />
                </UDropdownMenu>
            </template>
        </UDashboardSidebar>

        <slot />
    </UDashboardGroup>
</template>