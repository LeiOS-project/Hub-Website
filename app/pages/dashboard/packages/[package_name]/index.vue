<script setup lang="ts">
import type { GetDevPackagesPackageNameResponses, PostDevPackagesData } from '@/api-client/types.gen'
type DevPackage = GetDevPackagesPackageNameResponses[200]['data'];
type NewDevPackage = NonNullable<PostDevPackagesData['body']>;

const route = useRoute()
const toast = useToast()

const pkg = inject('package_data') as Ref<DevPackage | NewDevPackage>;
const loadingPkg = inject('package_loading') as Ref<boolean>;
const is_new_pkg = inject('package_is_new') as boolean;


</script>

<template>
    <div v-if="loadingPkg" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl text-slate-400" />
    </div>

    <template v-else-if="pkg">
        <!-- Package Info -->
        <UCard class="border-slate-800 bg-slate-900/60">
            <template #header>
                <h2 class="text-lg font-semibold flex items-center gap-2">
                    <UIcon name="i-lucide-info" class="text-sky-400" />
                    Package Information
                </h2>
            </template>

            <div class="grid gap-4 sm:grid-cols-2">
                <div>
                    <p class="text-sm text-slate-400">Description</p>
                    <p class="mt-1">{{ pkg.description || '—' }}</p>
                </div>
                <div>
                    <p class="text-sm text-slate-400">Homepage</p>
                    <UButton v-if="pkg.homepage_url" :to="pkg.homepage_url" target="_blank" :label="pkg.homepage_url"
                        variant="link" color="primary" class="mt-1 p-0" />
                    <p v-else class="mt-1">—</p>
                </div>
                <div>
                    <p class="text-sm text-slate-400">Stable Release (amd64)</p>
                    <p class="mt-1 font-mono">{{ (pkg as DevPackage).latest_stable_release_amd64 || '—' }}</p>
                </div>
                <div>
                    <p class="text-sm text-slate-400">Stable Release (arm64)</p>
                    <p class="mt-1 font-mono">{{ (pkg as DevPackage).latest_stable_release_arm64 || '—' }}</p>
                </div>
                <div>
                    <p class="text-sm text-slate-400">Testing Release (amd64)</p>
                    <p class="mt-1 font-mono">{{ (pkg as DevPackage).latest_testing_release_amd64 || '—' }}</p>
                </div>
                <div>
                    <p class="text-sm text-slate-400">Testing Release (arm64)</p>
                    <p class="mt-1 font-mono">{{ (pkg as DevPackage).latest_testing_release_arm64 || '—' }}</p>
                </div>
            </div>
        </UCard>

        
    </template>

</template>
