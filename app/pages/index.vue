<script setup lang="ts">


</script>

<template>
    <div class="space-y-0">
        <!-- Hero Section -->
        <section class="relative flex min-h-[90vh] items-center overflow-hidden bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.15),transparent)]">
            <div class="pointer-events-none absolute inset-0 overflow-hidden">
                <div class="absolute h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" style="top:25%;left:25%"></div>
                <div class="absolute h-96 w-96 rounded-full bg-sky-400/5 blur-3xl" style="bottom:25%;right:25%"></div>
            </div>

            <UContainer class="relative z-10">
                <div class="mx-auto max-w-4xl text-center">
                    <UBadge color="primary" variant="soft" size="xl" class="mb-6 inline-flex items-center gap-1">
                        <UIcon name="i-lucide-sparkles" />
                        Debian-based Linux Distribution
                    </UBadge>

                    <h1 class="mb-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-7xl">
                        Linux, <span class="bg-linear-to-tr from-sky-400 to-sky-200 bg-clip-text text-transparent">Refined</span>
                    </h1>

                    <p class="mx-auto mb-8 max-w-2xl leading-[1.6] text-lg text-slate-400 sm:text-xl lg:text-2xl">
                        A Debian-based OS focused on stability, performance, and an exceptional out-of-box experience.
                        Built for developers. Designed for everyone.
                    </p>

                    <div class="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
                        <UButton to="#download" size="xl" color="primary" class="px-8">
                            <template #leading>
                                <UIcon name="i-lucide-download" />
                            </template>
                            Download LeiOS
                        </UButton>
                        <UButton to="https://github.com/LeiOS-project" target="_blank" size="xl" color="neutral" variant="outline" class="px-8">
                            <template #leading>
                                <UIcon name="i-lucide-github" />
                            </template>
                            View on GitHub
                        </UButton>
                    </div>

                    <div class="mx-auto grid max-w-xl w-max grid-cols-2 gap-8 text-center md:max-w-3xl md:grid-cols-4">
                        <div v-for="stat in stats" :key="stat.label" class="space-y-1">
                            <div class="text-2xl font-bold text-sky-400 md:text-3xl">{{ stat.value }}</div>
                            <div class="text-sm text-slate-500">{{ stat.label }}</div>
                        </div>
                    </div>
                </div>
            </UContainer>

            <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-slate-500">
                <UIcon name="i-lucide-chevron-down" class="text-xl" />
            </div>
        </section>

        <!-- Features Section -->
        <section id="features" class="bg-slate-950/50 py-24">
            <UContainer>
                <header class="mb-12 text-center">
                    <UBadge color="primary" variant="soft" size="xl" class="mb-3">Features</UBadge>
                    <h2 class="mb-3 text-3xl font-bold sm:text-4xl lg:text-5xl">Why Choose LeiOS?</h2>
                    <p class="mx-auto max-w-3xl text-lg text-slate-400">
                        Every aspect of LeiOS is designed with care to provide you the best Linux experience.
                    </p>
                </header>

                <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    <UCard
                        v-for="feature in features"
                        :key="feature.title"
                        class="border-slate-800 bg-slate-900/50 transition duration-300 hover:-translate-y-1 hover:border-sky-400/50"
                    >
                        <div class="space-y-3 p-2">
                            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-500/10">
                                <UIcon :name="feature.icon" class="text-xl text-sky-400" />
                            </div>
                            <h3 class="text-lg font-semibold">{{ feature.title }}</h3>
                            <p class="text-slate-400 leading-relaxed">{{ feature.description }}</p>
                        </div>
                    </UCard>
                </div>
            </UContainer>
        </section>

        <!-- Download Section -->
        <section id="download" class="relative py-24">
            <div class="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-sky-500/5 to-transparent"></div>

            <UContainer class="relative z-10">
                <header class="mb-12 text-center">
                    <UBadge color="primary" variant="soft" size="xl" class="mb-3">Download</UBadge>
                    <h2 class="mb-3 text-3xl font-bold sm:text-4xl lg:text-5xl">Get Started with LeiOS</h2>
                    <p class="mx-auto max-w-3xl text-lg text-slate-400">
                        Download the latest version and experience Linux the way it should be.
                    </p>
                </header>

                <div class="mx-auto max-w-3xl space-y-6">
                    <UCard class="border-slate-800 bg-slate-900/80">
                        <div class="space-y-6 p-6 text-center">
                            <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-sky-500/10">
                                <UIcon name="i-lucide-download" class="text-4xl text-sky-400" />
                            </div>
                            <h3 class="text-xl font-bold">LeiOS Latest</h3>
                            <p class="text-slate-400">Based on Debian Stable • 64-bit (x86_64)</p>

                            <div class="flex flex-col justify-center gap-4 sm:flex-row">
                                <UButton size="lg" color="primary" class="px-8" disabled>
                                    <template #leading>
                                        <UIcon name="i-lucide-download" />
                                    </template>
                                    Download ISO (Coming Soon)
                                </UButton>
                            </div>

                            <p class="text-sm text-slate-500">
                                Check our
                                <NuxtLink to="https://blog.leicraftmc.de/tag/leios/" target="_blank" class="text-sky-400 hover:underline">
                                    blog
                                </NuxtLink>
                                for release announcements and updates.
                            </p>
                        </div>
                    </UCard>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <UCard
                            v-for="link in sourceLinks"
                            :key="link.title"
                            class="border-slate-800 bg-slate-900/50 transition hover:border-sky-400/50"
                        >
                            <NuxtLink :to="link.to" target="_blank" class="flex items-center gap-4 p-4 text-slate-100 no-underline">
                                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800">
                                    <UIcon :name="link.icon" class="text-lg text-sky-400" />
                                </div>
                                <div class="min-w-0 flex-1">
                                    <h4 class="font-semibold">{{ link.title }}</h4>
                                    <p class="truncate text-sm text-slate-400">{{ link.subtitle }}</p>
                                </div>
                                <UIcon name="i-lucide-external-link" class="text-slate-500" />
                            </NuxtLink>
                        </UCard>
                    </div>
                </div>
            </UContainer>
        </section>

        <!-- Community Section -->
        <section id="community" class="bg-slate-950/50 py-24">
            <UContainer>
                <header class="mb-12 text-center">
                    <UBadge color="primary" variant="soft" size="xl" class="mb-3">Community</UBadge>
                    <h2 class="mb-3 text-3xl font-bold sm:text-4xl lg:text-5xl">Join the Community</h2>
                    <p class="mx-auto max-w-3xl text-lg text-slate-400">
                        Connect with other LeiOS users, get help, and contribute to the project.
                    </p>
                </header>

                <div class="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
                    <UCard
                        v-for="card in communityCards"
                        :key="card.title"
                        :class="[
                            'border-slate-800 bg-slate-900/80 transition duration-300 hover:-translate-y-1',
                            card.color === 'indigo' ? 'hover:border-indigo-400/50' : '',
                            card.color === 'orange' ? 'hover:border-orange-400/50' : '',
                            card.color === 'green' ? 'hover:border-green-400/50' : ''
                        ]"
                    >
                        <NuxtLink :to="card.to" target="_blank" class="block space-y-4 p-4 text-center no-underline">
                            <div
                                :class="[
                                    'mx-auto flex h-16 w-16 items-center justify-center rounded-xl',
                                    card.color === 'indigo' ? 'bg-indigo-400/10' : '',
                                    card.color === 'orange' ? 'bg-orange-400/10' : '',
                                    card.color === 'green' ? 'bg-green-400/10' : ''
                                ]"
                            >
                                <UIcon
                                    :name="card.icon"
                                    :class="[
                                        'text-3xl',
                                        card.color === 'indigo' ? 'text-indigo-400' : '',
                                        card.color === 'orange' ? 'text-orange-400' : '',
                                        card.color === 'green' ? 'text-green-400' : ''
                                    ]"
                                />
                            </div>
                            <h3 class="text-lg font-semibold">{{ card.title }}</h3>
                            <p class="text-sm text-slate-400 leading-relaxed">{{ card.description }}</p>
                            <UButton color="neutral" variant="soft" size="sm" class="pointer-events-none">
                                {{ card.buttonText }}
                                <template #trailing>
                                    <UIcon name="i-lucide-external-link" class="text-sm" />
                                </template>
                            </UButton>
                        </NuxtLink>
                    </UCard>
                </div>
            </UContainer>
        </section>

        <!-- CTA Section -->
        <section class="relative overflow-hidden py-28 ">
            <div class="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-sky-500/5 to-transparent"></div>

            <UContainer class="relative z-10">
                <div class="mx-auto max-w-3xl text-center">
                    <h2 class="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
                        Ready to Try <span class="bg-linear-to-tr from-sky-400 to-sky-200 bg-clip-text text-transparent">LeiOS</span>?
                    </h2>
                    <p class="mb-8 text-lg text-slate-400">
                        Experience a Linux distribution that just works. Stable, fast, and designed with you in mind.
                    </p>
                    <div class="flex flex-col justify-center gap-4 sm:flex-row">
                        <UButton to="#download" size="xl" color="primary" class="px-8">
                            <template #leading>
                                <UIcon name="i-lucide-download" />
                            </template>
                            Download Now
                        </UButton>
                        <UButton to="https://discord.gg/8YC5BXjCc5" target="_blank" size="xl" color="neutral" variant="outline" class="px-8">
                            <template #leading>
                                <UIcon name="i-lucide-message-circle" />
                            </template>
                            Join Discord
                        </UButton>
                    </div>
                </div>
            </UContainer>
        </section>
    </div>
</template>

