<script lang="ts" setup>
import type {
    ListReleaseStablePromotionRequestsResponses,
    CreateReleaseStablePromotionRequestData
} from '~/api-client';

const toast = useToast();

const pkgData = useSubrouterInjectedData<DevPackage>("package").inject().data;
const pkgRelease = useSubrouterInjectedData<DevPackageRelease, NewDevPackageRelease>("package_release", true).inject();
const pkgReleaseData = pkgRelease.data;

const versionWithLeiosPatch = computed(() => pkgReleaseData.value.version_with_leios_patch);
const fullPackageName = computed(() => pkgData.value.fullname);

type StablePromotionRequest = ListReleaseStablePromotionRequestsResponses[200]['data'][number];

const { data: stablePromotionRequestData, refresh } = await useAPIAsyncData<StablePromotionRequest | null>(
    `/dev/packages/${fullPackageName.value}/releases/${versionWithLeiosPatch.value}/stable-promotion-requests`,
    async () => {
        const res = await useAPI((api) => api.listReleaseStablePromotionRequests({
            path: {
                fullPackageName: fullPackageName.value,
                version_with_leios_patch: versionWithLeiosPatch.value
            }
        }));

        if (!res.success) {
            toast.add({
                title: 'Error',
                description: `Failed to load stable promotion request: ${res.message}`,
                color: 'error'
            });
            return null;
        }

        return res.data[0] ?? null;
    }
);

const stablePromotionRequest = computed(() => stablePromotionRequestData.value);
const submittingRequest = ref(false);

async function submitNewRequest() {
    submittingRequest.value = true;

    try {
        const res = await useAPI((api) => api.createReleaseStablePromotionRequest({
            path: {
                fullPackageName: fullPackageName.value,
                version_with_leios_patch: versionWithLeiosPatch.value
            },
            body: {}
        } as CreateReleaseStablePromotionRequestData));

        if (res.success) {
            toast.add({
                title: 'Success',
                description: 'Stable promotion request submitted successfully',
                color: 'success'
            });
            await refresh();
        } else {
            toast.add({
                title: 'Error',
                description: res.message,
                color: 'error'
            });
        }
    } catch {
        toast.add({
            title: 'Error',
            description: 'An unexpected error occurred.',
            color: 'error'
        });
    } finally {
        submittingRequest.value = false;
    }
}

async function onDeleteRequest() {
    if (!stablePromotionRequest.value) return;

    try {
        const res = await useAPI((api) => api.deleteReleaseStablePromotionRequest({
            path: {
                fullPackageName: fullPackageName.value,
                version_with_leios_patch: versionWithLeiosPatch.value,
                stablePromotionRequestID: stablePromotionRequest.value.id
            }
        }));

        if (res.success) {
            toast.add({
                title: 'Request deleted',
                description: 'Stable promotion request deleted successfully.',
                icon: 'i-lucide-check',
                color: 'success'
            });
            await refresh();
        } else {
            throw new Error(res.message || 'Failed to delete stable promotion request');
        }
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: error.message || 'An unexpected error occurred.',
            icon: 'i-lucide-x-circle',
            color: 'error'
        });
    }
}

function getStatusColor(status: StablePromotionRequest['status']) {
    switch (status) {
        case 'approved': return 'success';
        case 'denied': return 'error';
        case 'pending': return 'warning';
        default: return 'neutral';
    }
}

function getStatusIcon(status: StablePromotionRequest['status']) {
    switch (status) {
        case 'approved': return 'i-lucide-check-circle';
        case 'denied': return 'i-lucide-x-circle';
        case 'pending': return 'i-lucide-clock';
        default: return 'i-lucide-help-circle';
    }
}

</script>

<template>
    <DashboardPageBody>

        <!-- Create Request State -->
        <div v-if="!stablePromotionRequest"
            class="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden"
        >
            <div class="px-6 py-4 border-b border-slate-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                        <UIcon name="i-lucide-git-pull-request" class="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                        <h3 class="font-medium text-white">Stable Promotion Request</h3>
                        <p class="text-sm text-slate-400">
                            Request promotion to stable for release {{ versionWithLeiosPatch }}.
                        </p>
                    </div>
                </div>
            </div>

            <div class="p-6 space-y-6">
                <p class="text-sm text-slate-300">
                    No stable promotion request has been submitted for this release yet.
                    Once submitted, an administrator will review the request.
                </p>

                <div class="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                    <div class="flex gap-3">
                        <UIcon name="i-lucide-info" class="text-amber-400 mt-0.5 shrink-0" />
                        <div class="text-sm text-amber-300/90">
                            <p class="font-medium mb-1">Review Process</p>
                            <p class="text-xs text-amber-400/70">
                                Your request will be reviewed by administrators before the release is promoted to stable.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end">
                    <UButton
                        label="Submit Request"
                        icon="i-lucide-send"
                        color="primary"
                        :loading="submittingRequest"
                        @click="submitNewRequest"
                    />
                </div>
            </div>
        </div>

        <!-- Request Details State -->
        <div v-else class="space-y-6">

            <div class="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-800">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                            <UIcon class="w-5 h-5 text-sky-400" name="i-lucide-git-pull-request" />
                        </div>
                        <div>
                            <h3 class="font-medium text-white">
                                Stable Promotion Request #{{ stablePromotionRequest.id }}
                            </h3>
                            <p class="text-sm text-slate-400">
                                Details for release {{ versionWithLeiosPatch }}.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="p-6 space-y-4">
                    <!-- Status -->
                    <div class="flex items-center justify-between py-3 border-b border-slate-800">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Status</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <UIcon :name="getStatusIcon(stablePromotionRequest.status)" :class="{
                                'text-amber-400': stablePromotionRequest.status === 'pending',
                                'text-green-400': stablePromotionRequest.status === 'approved',
                                'text-red-400': stablePromotionRequest.status === 'denied'
                            }" />
                            <UBadge :color="getStatusColor(stablePromotionRequest.status)" variant="soft" size="md">
                                {{ stablePromotionRequest.status }}
                            </UBadge>
                        </div>
                    </div>

                    <!-- Release Version -->
                    <div class="flex items-center justify-between py-3 border-b border-slate-800">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Release Version</label>
                        </div>
                        <div class="text-right">
                            <NuxtLink
                                :to="`/dashboard/packages/${pkgData.fullname}/releases/${versionWithLeiosPatch}`"
                                class="font-mono text-sm text-primary-400 hover:underline"
                            >
                                {{ stablePromotionRequest.package_release_version }}
                            </NuxtLink>
                        </div>
                    </div>

                    <!-- Created At -->
                    <div class="flex items-center justify-between py-3 border-b border-slate-800">
                        <div>
                            <label class="text-sm font-medium text-slate-300">Created At</label>
                        </div>
                        <div class="text-right">
                            <span class="text-sm text-slate-400">
                                {{ new Date(stablePromotionRequest.created_at).toLocaleString() }}
                            </span>
                        </div>
                    </div>

                    <!-- Admin Note -->
                    <div class="flex flex-col gap-2 py-3">
                        <label class="text-sm font-medium text-slate-300">Admin Note</label>
                        <div v-if="stablePromotionRequest.admin_note" class="rounded-lg bg-slate-800/50 p-4">
                            <p class="text-sm text-slate-300 whitespace-pre-wrap">{{ stablePromotionRequest.admin_note }}</p>
                        </div>
                        <div v-else class="rounded-lg bg-slate-800/50 p-4">
                            <p class="text-sm text-slate-500 italic">No admin note available</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pending Info -->
            <div v-if="stablePromotionRequest.status === 'pending'" class="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                <div class="flex gap-3">
                    <UIcon name="i-lucide-alert-triangle" class="text-amber-400 mt-0.5 shrink-0" />
                    <div class="text-sm text-amber-300/90">
                        <p class="font-medium mb-1">Pending Review</p>
                        <p class="text-xs text-amber-400/70">
                            Your request is awaiting administrator review. You can delete it while it is pending.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Approved Info -->
            <div v-if="stablePromotionRequest.status === 'approved'" class="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                <div class="flex gap-3">
                    <UIcon name="i-lucide-check-circle" class="text-green-400 mt-0.5 shrink-0" />
                    <div class="text-sm text-green-300/90">
                        <p class="font-medium mb-1">Request Approved</p>
                        <p class="text-xs text-green-400/70">
                            This release has been approved for promotion to stable.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Denied Info -->
            <div v-if="stablePromotionRequest.status === 'denied'" class="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                <div class="flex gap-3">
                    <UIcon name="i-lucide-x-circle" class="text-red-400 mt-0.5 shrink-0" />
                    <div class="text-sm text-red-300/90">
                        <p class="font-medium mb-1">Request Denied</p>
                        <p class="text-xs text-red-400/70">
                            This request was denied. The admin note contains the reason.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
                <UButton
                    label="Back to Release"
                    icon="i-lucide-arrow-left"
                    color="neutral"
                    variant="soft"
                    :to="`/dashboard/packages/${pkgData.fullname}/releases/${versionWithLeiosPatch}`"
                />

                <div class="flex-1"></div>

                <UButton
                    v-if="stablePromotionRequest.status === 'pending'"
                    label="Delete Request"
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="soft"
                    @click="() => { onDeleteRequest(); }"
                />
            </div>
        </div>

    </DashboardPageBody>
</template>
