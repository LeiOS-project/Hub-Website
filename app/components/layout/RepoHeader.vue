<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const links = computed<NavigationMenuItem[]>(() => [
    {
        label: 'Repository',
        to: '/explorer'
    },
    {
        label: 'Dashboard',
        to: '/dashboard',
        children: [
            { label: 'Übersicht', to: '/dashboard' },
            { label: 'Benutzer', to: '/dashboard?tab=users' },
            { label: 'Releases', to: '/dashboard?tab=releases' }
        ]
    },
    {
        label: 'Community',
        to: '#community'
    },
    {
        label: 'Blog',
        to: 'https://blog.leicraftmc.de/tag/leios/',
        target: '_blank'
    }
])

const socialLinks = [
    { icon: 'i-lucide-github', to: 'https://github.com/LeiOS-project', label: 'GitHub' },
    { icon: 'i-lucide-message-circle', to: 'https://discord.gg/8YC5BXjCc5', label: 'Discord' }
]
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
                <UButton 
                    v-for="social in socialLinks" 
                    :key="social.label" 
                    :to="social.to" 
                    target="_blank"
                    :icon="social.icon" 
                    color="neutral" 
                    variant="ghost" 
                    size="lg" 
                    :aria-label="social.label"
                    class="hover:scale-110 transition-transform duration-200" 
                />
                <UButton 
                    icon="i-lucide-user"
                    to="/auth/profile"
                    color="primary" 
                    variant="soft" 
                    class="font-medium hidden sm:inline-flex"
                >
                    Profil
                </UButton>
            </div>
        </template>
    </UHeader>
</template>
