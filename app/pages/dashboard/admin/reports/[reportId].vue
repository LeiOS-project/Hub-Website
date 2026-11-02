<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui";
import type { AdminReport } from "~/utils/adminTypes";

definePageMeta({
	layout: "dashboard",
});

const route = useRoute();
const toast = useToast();

const reportId = Number(route.params.reportId);
if (!Number.isInteger(reportId) || reportId <= 0) {
	throw createError({ statusCode: 404, statusMessage: "Report not found" });
}

const {
	data: result,
	refresh,
	loading,
} = await useAPIAsyncData(
	`admin-report:${reportId}`,
	async () => await useAPI((api) => api.getAdminReportsByReportId({ path: { reportId } })),
);

const report = computed<AdminReport | null>(() =>
	result.value?.success ? result.value.data : null,
);

const error = computed(() => {
	const res = result.value;
	if (!res || res.success) return null;
	return createError({
		statusCode: res.code || 500,
		statusMessage: res.message || "Failed to load the report",
	});
});

useSeoMeta({
	title: `Report #${reportId} | Reports | LeiOS Hub`,
	description: "Review a reported package or publisher",
});

const breadcrumbItems: BreadcrumbItem[] = [
	{ label: "Reports", to: "/dashboard/admin/reports" },
	{ label: `#${reportId}` },
];

/** Where the reported package or publisher can be looked at and acted on. */
const targetLinks = computed(() => {
	const r = report.value;
	if (!r) return [];
	const label = encodeURIComponent(r.target_label);

	if (r.target_type === "package") {
		return [
			{ label: "Public page", icon: "i-lucide-external-link", to: `/explore/${r.target_label}` },
			{
				label: "Moderate in All Packages",
				icon: "i-lucide-shield-alert",
				to: `/dashboard/admin/packages?search=${label}`,
			},
			{
				label: "Developer page",
				icon: "i-lucide-settings",
				to: `/dashboard/packages/${r.target_label}`,
			},
			{
				label: "Audit log",
				icon: "i-lucide-scroll-text",
				to: `/dashboard/admin/audit-log?target_type=package&target_id=${r.target_id}`,
			},
		];
	}

	return [
		{ label: "Public profile", icon: "i-lucide-external-link", to: `/publishers/${r.target_label}` },
		{
			label: "Open in Publishers",
			icon: "i-lucide-building-2",
			to: `/dashboard/admin/publishers?search=${label}`,
		},
		{ label: "Manage", icon: "i-lucide-settings", to: `/dashboard/publishers/${r.target_label}` },
		{
			label: "Audit log",
			icon: "i-lucide-scroll-text",
			to: `/dashboard/admin/audit-log?target_type=publisher&target_id=${r.target_id}`,
		},
	];
});

// --- Resolve / dismiss ----------------------------------------------------------------------

const closeModalOpen = ref(false);
const closeStatus = ref<"resolved" | "dismissed">("resolved");
const closeNote = ref("");
const closing = ref(false);

function openClose(status: "resolved" | "dismissed") {
	closeStatus.value = status;
	closeNote.value = "";
	closeModalOpen.value = true;
}

async function submitClose() {
	closing.value = true;
	const status = closeStatus.value;
	const res = await useAPI((api) =>
		api.postAdminReportsByReportIdResolve({
			path: { reportId },
			body: { status, note: closeNote.value.trim() },
		}),
	);
	closing.value = false;

	if (!res.success) {
		toast.add({
			title: status === "resolved" ? "Failed to resolve the report" : "Failed to dismiss the report",
			description: res.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
		await refresh(); // e.g. closed by another admin in the meantime
		return;
	}

	toast.add({
		title: status === "resolved" ? "Report resolved" : "Report dismissed",
		icon: "i-lucide-check",
		color: "success",
	});
	closeModalOpen.value = false;
	await refresh();
}
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardPageHeader icon="i-lucide-flag" :breadcrumb-items="breadcrumbItems">
				<template #right>
					<UButton
						icon="i-lucide-refresh-cw"
						color="neutral"
						variant="subtle"
						aria-label="Refresh"
						:loading="loading"
						@click="refresh();"
					/>
				</template>
			</DashboardPageHeader>
		</template>

		<template #body>
			<UError v-if="error" :error="error" />

			<DashboardPageBody v-else-if="report">
				<div class="mx-auto w-full max-w-4xl space-y-6">
					<!-- Report -->
					<DashboardSectionCard
						:title="`Report #${report.id}`"
						:description="`Filed ${formatDate(report.created_at)}`"
						icon="i-lucide-flag"
					>
						<template #actions>
							<AdminStatusBadge :status="report.status" size="lg" />
						</template>

						<div class="divide-y divide-slate-800">
							<AdminDetailRow label="Reported">
								<div class="flex items-center gap-2 sm:justify-end">
									<UIcon
										:name="report.target_type === 'package' ? 'i-lucide-package' : 'i-lucide-building-2'"
										class="size-4 shrink-0 text-slate-400"
									/>
									<span class="font-medium text-white">{{ report.target_label }}</span>
									<UBadge color="neutral" variant="soft" size="sm" class="capitalize">
										{{ report.target_type }}
									</UBadge>
								</div>
							</AdminDetailRow>
							<AdminDetailRow label="Reason">
								<AdminReportReasonBadge :reason="report.reason" />
							</AdminDetailRow>
							<AdminDetailRow label="Reporter">
								<NuxtLink
									v-if="report.reporter_user_id"
									:to="`/dashboard/admin/users/${report.reporter_user_id}`"
									class="text-primary-400 hover:underline"
								>
									{{ report.reporter_username ?? `#${report.reporter_user_id}` }}
								</NuxtLink>
								<span v-else class="text-slate-500">Deleted user</span>
							</AdminDetailRow>
							<AdminDetailRow label="Filed">
								{{ formatDate(report.created_at) }}
							</AdminDetailRow>
						</div>

						<div class="mt-4">
							<p class="mb-2 text-sm font-medium text-slate-300">Details</p>
							<div class="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
								<p v-if="report.details" class="whitespace-pre-wrap break-words text-sm text-slate-200">
									{{ report.details }}
								</p>
								<p v-else class="text-sm italic text-slate-500">The reporter added no details.</p>
							</div>
						</div>
					</DashboardSectionCard>

					<!-- Target -->
					<DashboardSectionCard
						:title="report.target_type === 'package' ? 'Reported Package' : 'Reported Publisher'"
						:description="report.target_label"
						:icon="report.target_type === 'package' ? 'i-lucide-package' : 'i-lucide-building-2'"
					>
						<div class="flex flex-wrap gap-2">
							<UButton
								v-for="link in targetLinks"
								:key="link.label"
								:label="link.label"
								:icon="link.icon"
								:to="link.to"
								color="neutral"
								variant="subtle"
							/>
						</div>
					</DashboardSectionCard>

					<!-- Resolution -->
					<DashboardSectionCard
						v-if="report.status !== 'open'"
						title="Resolution"
						:description="
							report.status === 'resolved' ? 'Closed with action taken' : 'Closed without action'
						"
						icon="i-lucide-gavel"
					>
						<div class="divide-y divide-slate-800">
							<AdminDetailRow label="Outcome">
								<AdminStatusBadge :status="report.status" />
							</AdminDetailRow>
							<AdminDetailRow label="Closed by">
								<NuxtLink
									v-if="report.resolved_by_user_id"
									:to="`/dashboard/admin/users/${report.resolved_by_user_id}`"
									class="text-primary-400 hover:underline"
								>
									{{ report.resolved_by_username ?? `#${report.resolved_by_user_id}` }}
								</NuxtLink>
								<span v-else class="text-slate-500">Deleted user</span>
							</AdminDetailRow>
							<AdminDetailRow label="Closed">
								{{ formatDate(report.resolved_at) }}
							</AdminDetailRow>
						</div>

						<div class="mt-4">
							<p class="mb-2 text-sm font-medium text-slate-300">Note</p>
							<div class="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
								<p
									v-if="report.resolution_note"
									class="whitespace-pre-wrap break-words text-sm text-slate-200"
								>
									{{ report.resolution_note }}
								</p>
								<p v-else class="text-sm italic text-slate-500">No note.</p>
							</div>
						</div>
					</DashboardSectionCard>

					<!-- Decision -->
					<div
						v-else
						class="flex flex-col gap-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 sm:flex-row sm:items-center"
					>
						<div class="flex flex-1 gap-3">
							<UIcon name="i-lucide-triangle-alert" class="mt-0.5 shrink-0 text-amber-400" />
							<div class="text-sm">
								<p class="font-medium text-amber-300">Waiting for review</p>
								<p class="text-amber-300/70">
									Take action on the target if needed (e.g. hide the package or suspend the
									owner), then resolve the report. Dismiss it when no action is needed.
								</p>
							</div>
						</div>
						<div class="flex shrink-0 gap-2">
							<UButton
								label="Dismiss"
								icon="i-lucide-circle-slash"
								color="neutral"
								variant="subtle"
								@click="openClose('dismissed');"
							/>
							<UButton
								label="Resolve"
								icon="i-lucide-circle-check"
								color="success"
								@click="openClose('resolved');"
							/>
						</div>
					</div>
				</div>
			</DashboardPageBody>
		</template>
	</UDashboardPanel>

	<DashboardModal
		v-model:open="closeModalOpen"
		:title="closeStatus === 'resolved' ? `Resolve Report #${reportId}` : `Dismiss Report #${reportId}`"
		:description="
			closeStatus === 'resolved' ? 'Action was taken on the target' : 'No action is needed'
		"
		:icon="closeStatus === 'resolved' ? 'i-lucide-circle-check' : 'i-lucide-circle-slash'"
		:icon-color="closeStatus === 'resolved' ? 'emerald' : 'neutral'"
	>
		<UFormField
			label="Note"
			help="Optional. Kept with the report and in the audit log."
		>
			<UTextarea
				v-model="closeNote"
				:rows="4"
				:maxlength="2000"
				autoresize
				:placeholder="
					closeStatus === 'resolved' ? 'e.g. Package hidden, owner suspended' : 'e.g. Works as intended'
				"
				class="w-full"
			/>
		</UFormField>

		<template #footer>
			<div class="flex justify-end gap-2">
				<UButton label="Cancel" color="neutral" variant="ghost" @click="closeModalOpen = false;" />
				<UButton
					:label="closeStatus === 'resolved' ? 'Resolve' : 'Dismiss'"
					:icon="closeStatus === 'resolved' ? 'i-lucide-circle-check' : 'i-lucide-circle-slash'"
					:color="closeStatus === 'resolved' ? 'success' : 'neutral'"
					:loading="closing"
					@click="submitClose();"
				/>
			</div>
		</template>
	</DashboardModal>
</template>
