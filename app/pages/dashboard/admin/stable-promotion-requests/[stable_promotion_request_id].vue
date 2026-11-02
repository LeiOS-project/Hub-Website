<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui";
import type { AdminPackageRelease, AdminStableRequest } from "~/utils/adminTypes";

definePageMeta({
	layout: "dashboard",
});

const route = useRoute();

const requestId = Number(route.params.stable_promotion_request_id);
if (!Number.isInteger(requestId) || requestId <= 0) {
	throw createError({ statusCode: 404, statusMessage: "Stable promotion request not found" });
}

useSeoMeta({
	title: `Request #${requestId} | Stable Promotion Requests | LeiOS Hub`,
	description: "Review stable promotion request details",
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

const packageLink = computed(() =>
	request.value ? `/dashboard/packages/${request.value.package_fullname}` : "",
);
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
const releaseError = computed(() => {
	const res = releaseResult.value;
	return res && !res.success ? res.message || "Failed to load the release" : null;
});

const architectures = computed(() => {
	const archs = release.value?.architectures;
	if (!archs) return [];
	if (archs.is_all) return [{ label: "all", description: "Architecture-independent" }];
	return [
		...(archs.amd64 ? [{ label: "amd64", description: "x86-64" }] : []),
		...(archs.arm64 ? [{ label: "arm64", description: "ARM 64-bit" }] : []),
	];
});

// Decision
const decisionModalOpen = ref(false);
const initialDecision = ref<"approved" | "denied">("approved");

function openDecision(decision: "approved" | "denied") {
	initialDecision.value = decision;
	decisionModalOpen.value = true;
}

async function refreshAll() {
	await refresh();
	await refreshRelease();
}
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
						@click="refreshAll();"
					/>
				</template>
			</DashboardPageHeader>
		</template>

		<template #body>
			<UError v-if="error" :error="error" />

			<DashboardPageBody v-else-if="request">
				<div class="mx-auto w-full max-w-4xl space-y-6">
					<!-- Request -->
					<DashboardSectionCard
						:title="`Request #${request.id}`"
						:description="`Stable promotion of ${request.package_fullname} ${request.package_release_version}`"
						icon="i-lucide-git-pull-request"
					>
						<template #actions>
							<AdminStatusBadge :status="request.status" size="lg" />
						</template>

						<div class="divide-y divide-slate-800">
							<AdminDetailRow label="Package">
								<NuxtLink :to="packageLink" class="font-medium text-primary-400 hover:underline">
									{{ request.package_fullname }}
								</NuxtLink>
							</AdminDetailRow>
							<AdminDetailRow label="Release">
								<NuxtLink :to="releaseLink" class="font-mono text-primary-400 hover:underline">
									{{ request.package_release_version }}
								</NuxtLink>
							</AdminDetailRow>
							<AdminDetailRow label="Requested">
								{{ formatDate(request.created_at) }}
							</AdminDetailRow>
							<AdminDetailRow label="Admin note">
								<span v-if="request.admin_note" class="whitespace-pre-wrap">{{ request.admin_note }}</span>
								<span v-else class="italic text-slate-500">None</span>
							</AdminDetailRow>
						</div>
					</DashboardSectionCard>

					<!-- Release -->
					<DashboardSectionCard
						title="Release"
						description="What would move into the stable repository"
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

						<div v-if="releaseLoading && !releaseResult" class="flex justify-center py-6">
							<UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-slate-400" />
						</div>

						<UAlert
							v-else-if="releaseError"
							color="error"
							variant="subtle"
							icon="i-lucide-circle-alert"
							title="Failed to load the release"
							:description="releaseError"
						>
							<template #actions>
								<UButton
									label="Retry"
									color="neutral"
									variant="subtle"
									size="sm"
									@click="refreshRelease();"
								/>
							</template>
						</UAlert>

						<div v-else-if="release" class="space-y-4">
							<div class="divide-y divide-slate-800">
								<AdminDetailRow label="Uploaded">
									{{ formatDate(release.created_at) }}
								</AdminDetailRow>
								<AdminDetailRow label="Architectures">
									<div v-if="architectures.length" class="flex flex-wrap gap-1 sm:justify-end">
										<UTooltip v-for="arch in architectures" :key="arch.label" :text="arch.description">
											<UBadge color="primary" variant="soft" class="font-mono">{{ arch.label }}</UBadge>
										</UTooltip>
									</div>
									<span v-else class="text-amber-400">No files uploaded yet</span>
								</AdminDetailRow>
							</div>

							<div>
								<p class="mb-2 text-sm font-medium text-slate-300">Changelog</p>
								<pre
									v-if="release.changelog"
									class="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-800 bg-slate-950/40 p-4 font-mono text-xs text-slate-200"
								>{{ release.changelog }}</pre>
								<div v-else class="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
									<p class="text-sm italic text-slate-500">No changelog provided.</p>
								</div>
							</div>
						</div>
					</DashboardSectionCard>

					<!-- Decision -->
					<div
						v-if="request.status === 'pending'"
						class="flex flex-col gap-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 sm:flex-row sm:items-center"
					>
						<div class="flex flex-1 gap-3">
							<UIcon name="i-lucide-triangle-alert" class="mt-0.5 shrink-0 text-amber-400" />
							<div class="text-sm">
								<p class="font-medium text-amber-300">Pending review</p>
								<p class="text-amber-300/70">
									Approved releases move into the stable repository with the next OS release.
								</p>
							</div>
						</div>
						<div class="flex shrink-0 gap-2">
							<UButton
								label="Deny"
								icon="i-lucide-x"
								color="error"
								variant="soft"
								@click="openDecision('denied');"
							/>
							<UButton
								label="Approve"
								icon="i-lucide-check"
								color="success"
								@click="openDecision('approved');"
							/>
						</div>
					</div>

					<UAlert
						v-else-if="request.status === 'approved'"
						color="success"
						variant="subtle"
						icon="i-lucide-circle-check"
						title="Request approved"
						description="The release moves into the stable repository with the next OS release (or already has)."
					/>

					<UAlert
						v-else
						color="error"
						variant="subtle"
						icon="i-lucide-circle-x"
						title="Request denied"
						description="The release stays out of stable. The admin note explains why."
					/>

					<UButton
						label="Back to Requests"
						icon="i-lucide-arrow-left"
						color="neutral"
						variant="soft"
						to="/dashboard/admin/stable-promotion-requests"
					/>
				</div>
			</DashboardPageBody>
		</template>
	</UDashboardPanel>

	<AdminStableRequestDecisionModal
		v-model:open="decisionModalOpen"
		:request="request"
		:initial-decision="initialDecision"
		@decided="refresh()"
	/>
</template>
