<script lang="ts" setup>
/**
 * The release's way to stable, for publisher members: request a promotion (with a message for the
 * reviewers), follow its status (awaiting review → queued → released), talk with the moderators
 * and withdraw the request.
 */
import {
	STABLE_STATUS_META,
	type StableRequest,
	type StableRequestMessage,
} from "~/utils/stablePromotion";

const toast = useToast();

const pkgData = useSubrouterInjectedData<DevPackage>("package").inject().data;
const pkgRelease = useSubrouterInjectedData<DevPackageRelease, NewDevPackageRelease>(
	"package_release",
	true,
).inject();
const pkgReleaseData = pkgRelease.data;

const versionWithLeiosPatch = computed(() => pkgReleaseData.value.version_with_leios_patch);
const fullPackageName = computed(() => pkgData.value.fullname);
const releasePath = computed(() => ({
	fullPackageName: fullPackageName.value,
	version_with_leios_patch: versionWithLeiosPatch.value,
}));

const { data: stablePromotionRequest, refresh } = await useAPIAsyncData<StableRequest | null>(
	`/dev/packages/${fullPackageName.value}/releases/${versionWithLeiosPatch.value}/stable-promotion-requests`,
	async () => {
		const res = await useAPI((api) =>
			api.listReleaseStablePromotionRequests({ path: releasePath.value }),
		);

		if (!res.success) {
			toast.add({
				title: "Failed to load the stable promotion request",
				description: res.message,
				color: "error",
			});
			return null;
		}

		return res.data[0] ?? null;
	},
);

const {
	data: messages,
	loading: messagesLoading,
	refresh: refreshMessages,
} = await useAPILazyAsyncData<StableRequestMessage[]>(
	`/dev/packages/${fullPackageName.value}/releases/${versionWithLeiosPatch.value}/stable-promotion-requests/messages`,
	async () => {
		const request = stablePromotionRequest.value;
		if (!request) return [];
		const res = await useAPI((api) =>
			api.listReleaseStablePromotionRequestMessages({
				path: { ...releasePath.value, stablePromotionRequestID: request.id },
			}),
		);
		return res.success ? res.data : [];
	},
);

const hasUploadedPackage = computed(() => {
	const data = pkgReleaseData.value;
	if ("architectures" in data) {
		const arch = data.architectures;
		return arch.amd64 || arch.arm64 || arch.is_all;
	}
	return false;
});

// New request
const message = ref("");
const submittingRequest = ref(false);

async function submitNewRequest() {
	submittingRequest.value = true;
	const res = await useAPI((api) =>
		api.createReleaseStablePromotionRequest({
			path: releasePath.value,
			body: { message: message.value.trim() || undefined },
		}),
	);
	submittingRequest.value = false;

	if (!res.success) {
		toast.add({
			title: "Failed to request the stable promotion",
			description: res.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
		return;
	}

	toast.add({
		title: "Stable promotion requested",
		description: "A moderator reviews it. You can follow it and reply here.",
		icon: "i-lucide-check",
		color: "success",
	});
	message.value = "";
	await refresh();
	await refreshMessages();
}

async function sendMessage(body: string) {
	const request = stablePromotionRequest.value;
	if (!request) return false;

	const res = await useAPI((api) =>
		api.createReleaseStablePromotionRequestMessage({
			path: { ...releasePath.value, stablePromotionRequestID: request.id },
			body: { body },
		}),
	);
	if (!res.success) {
		toast.add({
			title: "Failed to send the reply",
			description: res.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
		return false;
	}
	await refreshMessages();
	return true;
}

// Withdraw
const withdrawOpen = ref(false);
const withdrawing = ref(false);

async function withdrawRequest() {
	const request = stablePromotionRequest.value;
	if (!request) return;

	withdrawing.value = true;
	const res = await useAPI((api) =>
		api.deleteReleaseStablePromotionRequest({
			path: { ...releasePath.value, stablePromotionRequestID: request.id },
		}),
	);
	withdrawing.value = false;
	withdrawOpen.value = false;

	if (!res.success) {
		toast.add({
			title: "Failed to withdraw the request",
			description: res.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
		return;
	}

	toast.add({ title: "Request withdrawn", icon: "i-lucide-check", color: "success" });
	await refresh();
	await refreshMessages();
}

const STATUS_TEXTS = {
	pending: "A moderator reviews the request. Answer their questions below.",
	queued: "Approved. The release moves into stable with the next LeiOS release.",
	released: "This release went into stable with a LeiOS release.",
	denied:
		"The release stays out of stable for now. The conversation explains why; reply if you want to discuss it.",
} as const;
</script>

<template>
    <DashboardPageBody>
        <div class="mx-auto w-full max-w-4xl space-y-6">
            <!-- No request yet -->
            <DashboardSectionCard
                v-if="!stablePromotionRequest"
                title="Request stable promotion"
                :description="`Ask the moderators to move ${versionWithLeiosPatch} into the stable repository`"
                icon="i-lucide-git-pull-request"
            >
                <div class="space-y-4">
                    <p class="text-sm text-slate-300">
                        Releases reach LeiOS users on stable with the next LeiOS release after a moderator
                        approved them. Tell the reviewers what changed, especially for security fixes.
                    </p>

                    <UAlert
                        v-if="!hasUploadedPackage"
                        color="error"
                        variant="subtle"
                        icon="i-lucide-triangle-alert"
                        title="No package files yet"
                        description="Upload at least one .deb file for this release before you request a stable promotion."
                    />

                    <UFormField label="Message to the reviewers" help="Optional. Markdown works.">
                        <MarkdownEditor
                            v-model="message"
                            :disabled="submittingRequest || !hasUploadedPackage"
                            placeholder="What changed, why it should go to stable, anything urgent…"
                            min-height-class="min-h-28"
                        />
                    </UFormField>

                    <div class="flex justify-end">
                        <UButton
                            label="Request stable promotion"
                            icon="i-lucide-send"
                            :loading="submittingRequest"
                            :disabled="!hasUploadedPackage"
                            @click="submitNewRequest()"
                        />
                    </div>
                </div>
            </DashboardSectionCard>

            <template v-else>
                <!-- Status -->
                <div
                    class="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center"
                >
                    <div class="flex flex-1 items-start gap-3">
                        <UIcon
                            :name="STABLE_STATUS_META[stablePromotionRequest.status].icon"
                            :class="['mt-0.5 size-5 shrink-0', STABLE_STATUS_META[stablePromotionRequest.status].textClass]"
                        />
                        <div class="space-y-1 text-sm">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="font-medium text-white">Request #{{ stablePromotionRequest.id }}</span>
                                <HubStableStatusBadge
                                    :status="stablePromotionRequest.status"
                                    :os-release-version="stablePromotionRequest.os_release_version"
                                />
                            </div>
                            <p class="text-slate-400">{{ STATUS_TEXTS[stablePromotionRequest.status] }}</p>
                            <p class="text-xs text-slate-500">
                                Requested {{ formatDate(stablePromotionRequest.created_at) }}
                                <template v-if="stablePromotionRequest.status_changed_at">
                                    · last change {{ formatDate(stablePromotionRequest.status_changed_at) }}
                                </template>
                            </p>
                        </div>
                    </div>
                    <UButton
                        v-if="stablePromotionRequest.status !== 'released'"
                        label="Withdraw"
                        icon="i-lucide-undo-2"
                        color="error"
                        variant="soft"
                        class="shrink-0"
                        @click="withdrawOpen = true;"
                    />
                </div>

                <!-- Conversation -->
                <DashboardSectionCard
                    title="Conversation"
                    description="Your publisher's members and the LeiOS moderators see these messages"
                    icon="i-lucide-messages-square"
                >
                    <StableConversation
                        :messages="messages ?? []"
                        :loading="messagesLoading"
                        :send="sendMessage"
                        :closed-text="
                            stablePromotionRequest.status === 'released'
                                ? 'This release is in stable; the conversation is closed.'
                                : null
                        "
                    />
                </DashboardSectionCard>
            </template>

            <UButton
                label="Back to release"
                icon="i-lucide-arrow-left"
                color="neutral"
                variant="soft"
                :to="`/dashboard/packages/${pkgData.fullname}/releases/${versionWithLeiosPatch}`"
            />
        </div>

        <DashboardModal
            v-model:open="withdrawOpen"
            title="Withdraw the request?"
            description="The request and its conversation are deleted"
            icon="i-lucide-undo-2"
        >
            <p class="text-sm text-slate-300">
                <template v-if="stablePromotionRequest?.status === 'queued'">
                    The release leaves the stable queue and does not go out with the next LeiOS release.
                </template>
                You can request the promotion again later.
            </p>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton label="Cancel" color="neutral" variant="ghost" :disabled="withdrawing" @click="withdrawOpen = false;" />
                    <UButton label="Withdraw" icon="i-lucide-undo-2" color="error" :loading="withdrawing" @click="withdrawRequest()" />
                </div>
            </template>
        </DashboardModal>
    </DashboardPageBody>
</template>
