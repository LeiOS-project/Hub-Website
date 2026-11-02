<script setup lang="ts">
/**
 * One stable promotion request for reviewers: the release and what it replaces in stable, the
 * conversation with the publisher, and the status actions (queue, deny, back to review).
 */
import type { BreadcrumbItem } from "@nuxt/ui";
import type { AdminPackageRelease, AdminStableRequest } from "~/utils/adminTypes";
import { STABLE_STATUS_META, type StableRequestMessage } from "~/utils/stablePromotion";

definePageMeta({
	layout: "dashboard",
});

const route = useRoute();
const toast = useToast();

const requestId = Number(route.params.stable_promotion_request_id);
if (!Number.isInteger(requestId) || requestId <= 0) {
	throw createError({ statusCode: 404, statusMessage: "Stable promotion request not found" });
}

useSeoMeta({
	title: `Request #${requestId} | Stable Promotion Requests | LeiOS Hub`,
	description: "Review a stable promotion request",
});

const breadcrumbItems: BreadcrumbItem[] = [
	{ label: "Stable Promotion Requests", to: "/dashboard/admin/stable-promotion-requests" },
	{ label: `#${requestId}` },
];

const {
	data: result,
	refresh,
	loading,
} = await useAPIAsyncData(
	`admin-stable-promotion-request:${requestId}`,
	async () =>
		await useAPI((api) =>
			api.getAdminStablePromotionRequestsByStablePromotionRequestId({
				path: { stablePromotionRequestID: requestId },
			}),
		),
);

const request = computed<AdminStableRequest | null>(() =>
	result.value?.success ? result.value.data : null,
);

const error = computed(() => {
	const res = result.value;
	if (!res || res.success) return null;
	return createError({
		statusCode: res.code || 500,
		statusMessage: res.message || "Failed to load the stable promotion request",
	});
});

const releaseLink = computed(() =>
	request.value
		? `/dashboard/packages/${request.value.package_fullname}/releases/${request.value.package_release_version}`
		: "",
);

const {
	data: releaseResult,
	loading: releaseLoading,
	refresh: refreshRelease,
} = await useAPILazyAsyncData(`admin-stable-promotion-request:${requestId}:release`, async () => {
	const r = request.value;
	if (!r) return null;
	return await useAPI((api) =>
		api.getPackagesByFullPackageNameReleasesByVersionWithLeiosPatch({
			path: {
				fullPackageName: r.package_fullname,
				version_with_leios_patch: r.package_release_version,
			},
		}),
	);
});

const release = computed<AdminPackageRelease | null>(() =>
	releaseResult.value?.success ? releaseResult.value.data : null,
);

const architectures = computed(() => {
	const archs = request.value?.package_release_architectures;
	if (!archs) return [];
	if (archs.is_all) return [{ label: "all", description: "Architecture-independent" }];
	return [
		...(archs.amd64 ? [{ label: "amd64", description: "x86-64" }] : []),
		...(archs.arm64 ? [{ label: "arm64", description: "ARM 64-bit" }] : []),
	];
});

/** What is in stable now, per architecture ("–" for none). */
const currentStable = computed(() => {
	const stable = request.value?.package_latest_stable_release;
	if (!stable) return "–";
	if (stable.amd64 === stable.arm64) return stable.amd64 ?? "Not in stable yet";
	return `amd64 ${stable.amd64 ?? "–"} · arm64 ${stable.arm64 ?? "–"}`;
});

// Conversation
const {
	data: messages,
	loading: messagesLoading,
	refresh: refreshMessages,
} = await useAPILazyAsyncData<StableRequestMessage[]>(
	`admin-stable-promotion-request:${requestId}:messages`,
	async () => {
		const res = await useAPI((api) =>
			api.getAdminStablePromotionRequestsByStablePromotionRequestIdMessages({
				path: { stablePromotionRequestID: requestId },
			}),
		);
		return res.success ? res.data : [];
	},
);

async function sendMessage(body: string) {
	const res = await useAPI((api) =>
		api.postAdminStablePromotionRequestsByStablePromotionRequestIdMessages({
			path: { stablePromotionRequestID: requestId },
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

// Status changes
const statusModalOpen = ref(false);
const initialStatus = ref<"pending" | "queued" | "denied">("queued");

function openStatusChange(status: "pending" | "queued" | "denied") {
	initialStatus.value = status;
	statusModalOpen.value = true;
}

async function refreshAll() {
	await Promise.all([refresh(), refreshRelease(), refreshMessages()]);
}

const STATUS_HINTS = {
	pending: "Waiting for review. Queue the release for stable or deny the request.",
	queued:
		"Queued: the next OS release can include it. An administrator picks the releases when creating one.",
	released: "This release went into stable with an OS release. The request is closed.",
	denied:
		"Denied: the release stays out of stable. You can reopen the request or queue it after all.",
} as const;
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardPageHeader icon="i-lucide-git-pull-request" :breadcrumb-items="breadcrumbItems">
				<template #right>
					<UButton
						icon="i-lucide-refresh-cw"
						color="neutral"
						variant="subtle"
						aria-label="Refresh"
						:loading="loading"
						@click="refreshAll()"
					/>
				</template>
			</DashboardPageHeader>
		</template>

		<template #body>
			<UError v-if="error" :error="error" />

			<DashboardPageBody v-else-if="request">
				<div class="mx-auto w-full max-w-4xl space-y-6">
					<!-- Status and actions -->
					<div
						class="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center"
					>
						<div class="flex flex-1 items-start gap-3">
							<UIcon
								:name="STABLE_STATUS_META[request.status].icon"
								:class="['mt-0.5 size-5 shrink-0', STABLE_STATUS_META[request.status].textClass]"
							/>
							<div class="space-y-1 text-sm">
								<HubStableStatusBadge
									:status="request.status"
									:os-release-version="request.os_release_version"
									size="md"
								/>
								<p class="text-slate-400">{{ STATUS_HINTS[request.status] }}</p>
								<p v-if="request.status_changed_at" class="text-xs text-slate-500">
									Last change {{ formatDate(request.status_changed_at) }}
									<template v-if="request.status_changed_by_username">
										by @{{ request.status_changed_by_username }}
									</template>
								</p>
							</div>
						</div>
						<div v-if="request.status !== 'released'" class="flex shrink-0 flex-wrap gap-2">
							<UButton
								v-if="request.status === 'queued'"
								label="Take out of queue"
								icon="i-lucide-list-minus"
								color="warning"
								variant="soft"
								@click="openStatusChange('pending')"
							/>
							<UButton
								v-if="request.status === 'denied'"
								label="Reopen"
								icon="i-lucide-rotate-ccw"
								color="warning"
								variant="soft"
								@click="openStatusChange('pending')"
							/>
							<UButton
								v-if="request.status !== 'denied'"
								label="Deny"
								icon="i-lucide-x"
								color="error"
								variant="soft"
								@click="openStatusChange('denied')"
							/>
							<UButton
								v-if="request.status !== 'queued'"
								label="Queue for stable"
								icon="i-lucide-list-plus"
								color="info"
								@click="openStatusChange('queued')"
							/>
						</div>
					</div>

					<!-- Release -->
					<DashboardSectionCard
						:title="`${request.package_display_name} ${request.package_release_version}`"
						:description="request.package_fullname"
						icon="i-lucide-tag"
					>
						<template #actions>
							<UButton
								label="Open release"
								trailing-icon="i-lucide-arrow-right"
								color="neutral"
								variant="ghost"
								size="sm"
								:to="releaseLink"
							/>
						</template>

						<div class="space-y-4">
							<div class="divide-y divide-slate-800">
								<AdminDetailRow label="Requested">
									{{ formatDate(request.created_at) }}
									<template v-if="request.requested_by_username">
										by
										<NuxtLink
											:to="`/dashboard/admin/users/${request.requested_by_user_id}`"
											class="text-primary-400 hover:underline"
										>
											@{{ request.requested_by_username }}
										</NuxtLink>
									</template>
								</AdminDetailRow>
								<AdminDetailRow label="Uploaded">
									{{ formatDate(request.package_release_created_at) }}
								</AdminDetailRow>
								<AdminDetailRow label="Architectures">
									<div v-if="architectures.length" class="flex flex-wrap gap-1 sm:justify-end">
										<UTooltip v-for="arch in architectures" :key="arch.label" :text="arch.description">
											<UBadge color="primary" variant="soft" class="font-mono">{{ arch.label }}</UBadge>
										</UTooltip>
									</div>
									<span v-else class="text-amber-400">No files uploaded yet</span>
								</AdminDetailRow>
								<AdminDetailRow label="In stable now">
									<span class="font-mono">{{ currentStable }}</span>
								</AdminDetailRow>
								<AdminDetailRow v-if="request.os_release_version" label="Released with">
									<NuxtLink
										:to="`/dashboard/admin/os-releases/${request.os_release_version}`"
										class="font-mono text-primary-400 hover:underline"
									>
										LeiOS {{ request.os_release_version }}
									</NuxtLink>
								</AdminDetailRow>
							</div>

							<div>
								<p class="mb-2 text-sm font-medium text-slate-300">Changelog</p>
								<div class="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
									<USkeleton v-if="releaseLoading && !releaseResult" class="h-12 w-full" />
									<MarkdownContent
										v-else-if="release?.changelog"
										:value="release.changelog"
										compact
									/>
									<p v-else class="text-sm italic text-slate-500">No changelog provided.</p>
								</div>
							</div>
						</div>
					</DashboardSectionCard>

					<!-- Conversation -->
					<DashboardSectionCard
						title="Conversation"
						description="Talk with the publisher's members. They see every message here."
						icon="i-lucide-messages-square"
					>
						<StableConversation
							:messages="messages ?? []"
							:loading="messagesLoading"
							:send="sendMessage"
							:closed-text="
								request.status === 'released'
									? 'This request was released; its conversation is closed.'
									: null
							"
						/>
					</DashboardSectionCard>

					<UButton
						label="Back to requests"
						icon="i-lucide-arrow-left"
						color="neutral"
						variant="soft"
						to="/dashboard/admin/stable-promotion-requests"
					/>
				</div>
			</DashboardPageBody>
		</template>
	</UDashboardPanel>

	<AdminStableRequestStatusModal
		v-model:open="statusModalOpen"
		:request="request"
		:initial-status="initialStatus"
		@changed="refreshAll()"
	/>
</template>
