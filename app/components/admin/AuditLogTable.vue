<script setup lang="ts">
/**
 * Server-paginated audit-log table (`GET /admin/audit-log`). Filters come in as props; changing one
 * reloads from the first page. Rows with metadata expand to show it as JSON.
 * Exposes `refresh()` so a page can reload it after an action it just recorded.
 *
 * Slots: `filters` (filter controls in the table header, replaces the title) and `actions`
 * (header buttons, e.g. "View all").
 */
import type { TableColumn } from "@nuxt/ui";
import type {
	AdminAuditLogEntry,
	AdminAuditLogQuery,
	AdminAuditTargetType,
	AdminListOrder,
	AdminPage,
} from "~/utils/adminTypes";

type BadgeColor = "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";

const props = withDefaults(
	defineProps<{
		actorUserId?: number | null;
		/** Exact action ("user.suspend") or a group prefix ending in a dot ("user."). */
		action?: string | null;
		targetType?: AdminAuditTargetType | null;
		targetId?: string | null;
		order?: AdminListOrder;
		/** Heading shown in the table header. */
		title?: string;
		description?: string;
		defaultPageSize?: number;
		/** `false` shows only the first page, without pagination controls. */
		paginated?: boolean;
		/** Drop the actor column (e.g. on "actions by this user"). */
		hideActor?: boolean;
		emptyTitle?: string;
		emptyDescription?: string;
	}>(),
	{
		actorUserId: null,
		action: null,
		targetType: null,
		targetId: null,
		order: "newest",
		title: undefined,
		description: undefined,
		defaultPageSize: 25,
		paginated: true,
		hideActor: false,
		emptyTitle: "No entries",
		emptyDescription: "No audit-log entries match these filters.",
	},
);

const toast = useToast();

const page = ref(1);
const pageSize = ref(props.defaultPageSize);

const {
	data: entries,
	loading,
	refresh,
} = await useAPILazyAsyncData<AdminPage<AdminAuditLogEntry>>(
	`admin-audit-log-${useId()}`,
	async () => {
		const query: AdminAuditLogQuery = {
			limit: pageSize.value,
			offset: (page.value - 1) * pageSize.value,
			order: props.order,
		};
		if (props.actorUserId) query.actor_user_id = props.actorUserId;
		if (props.action) query.action = props.action;
		if (props.targetType) query.target_type = props.targetType;
		if (props.targetId) query.target_id = props.targetId;

		const res = await useAPI((api) => api.getAdminAuditLog({ query }));
		if (!res.success) {
			toast.add({
				title: "Failed to load the audit log",
				description: res.message,
				color: "error",
			});
			return { items: [], total: 0 };
		}
		return res.data;
	},
);

function reloadFromFirstPage() {
	if (page.value !== 1) {
		page.value = 1; // the page watcher reloads
	} else {
		refresh();
	}
}

watch(
	() => [props.actorUserId, props.action, props.targetType, props.targetId, props.order],
	reloadFromFirstPage,
);
watch(page, () => refresh());
watch(pageSize, reloadFromFirstPage);

defineExpose({ refresh });

const columns = computed<TableColumn<AdminAuditLogEntry>[]>(() => [
	{ id: "expand", header: "" },
	{ accessorKey: "created_at", header: "Time" },
	...(props.hideActor ? [] : [{ id: "actor", header: "Actor" }]),
	{ accessorKey: "action", header: "Action" },
	{ id: "target", header: "Target" },
]);

const ACTION_LABELS: Record<string, string> = {
	"user.signup": "Signed up",
	"user.create": "Created user",
	"user.update": "Updated user",
	"user.role_change": "Changed role",
	"user.delete": "Deleted user",
	"user.password_set": "Set password",
	"user.password_reset_link": "Created password reset link",
	"user.sessions_revoke": "Signed out everywhere",
	"user.suspend": "Suspended account",
	"user.unsuspend": "Lifted suspension",
	"user.email_verify": "Confirmed email",
	"publisher.create": "Created publisher",
	"publisher.update": "Updated publisher",
	"publisher.delete": "Deleted publisher",
	"publisher.verify": "Verified publisher",
	"publisher.unverify": "Removed verification",
	"publisher.transfer_ownership": "Transferred ownership",
	"publisher.member_add": "Added member",
	"publisher.member_update": "Changed member role",
	"publisher.member_remove": "Removed member",
	"package.create": "Created package",
	"package.update": "Updated package",
	"package.delete": "Deleted package",
	"package.moderation_update": "Updated moderation",
	"package.role_assign": "Assigned package role",
	"package.role_update": "Changed package role",
	"package.role_unassign": "Removed package role",
	"release.create": "Created release",
	"release.update": "Updated release",
	"release.delete": "Deleted release",
	"release.upload": "Uploaded release file",
	"stable_request.create": "Requested stable promotion",
	"stable_request.withdraw": "Withdrew stable request",
	"stable_request.decide": "Decided stable request",
	"os_release.create": "Created OS release",
	"os_release.update": "Updated OS release",
	"report.create": "Filed report",
	"report.resolve": "Resolved report",
	"report.dismiss": "Dismissed report",
};

const GROUP_COLORS: Record<string, BadgeColor> = {
	user: "primary",
	publisher: "info",
	package: "success",
	release: "success",
	stable_request: "warning",
	os_release: "secondary",
	report: "error",
};

const TARGET_TYPES: Record<AdminAuditTargetType, { label: string; icon: string }> = {
	user: { label: "User", icon: "i-lucide-user" },
	publisher: { label: "Publisher", icon: "i-lucide-building-2" },
	package: { label: "Package", icon: "i-lucide-package" },
	release: { label: "Release", icon: "i-lucide-tag" },
	stable_promotion_request: { label: "Stable request", icon: "i-lucide-git-pull-request" },
	os_release: { label: "OS release", icon: "i-lucide-rocket" },
	report: { label: "Report", icon: "i-lucide-flag" },
};

function actionLabel(action: string) {
	if (ACTION_LABELS[action]) return ACTION_LABELS[action];
	const verb = action.split(".").slice(1).join(" ").replaceAll("_", " ");
	return verb ? verb.charAt(0).toUpperCase() + verb.slice(1) : action;
}

function actionColor(action: string): BadgeColor {
	return GROUP_COLORS[action.split(".")[0] ?? ""] ?? "neutral";
}

function targetLabel(entry: AdminAuditLogEntry) {
	return entry.target_label || (entry.target_id ? `#${entry.target_id}` : "—");
}

/** Where the target can be opened; `null` for deleted targets or unknown ids. */
function targetLink(entry: AdminAuditLogEntry): string | null {
	if (entry.action.endsWith(".delete")) return null;
	const id = entry.target_id;
	const label = entry.target_label;

	switch (entry.target_type) {
		case "user":
			return id ? `/dashboard/admin/users/${id}` : null;
		case "publisher":
			return label ? `/dashboard/publishers/${label}` : null;
		case "package":
			return label ? `/dashboard/packages/${label}` : null;
		case "release": {
			// Label: "<publisher>.<package> <version>"
			const [fullname, version] = (label ?? "").split(" ");
			return fullname && version ? `/dashboard/packages/${fullname}/releases/${version}` : null;
		}
		case "stable_promotion_request":
			return id ? `/dashboard/admin/stable-promotion-requests/${id}` : null;
		case "os_release":
			return label ? `/dashboard/admin/os-releases/${label}` : null;
		case "report":
			return id ? `/dashboard/admin/reports/${id}` : null;
		default:
			return null;
	}
}

function hasMetadata(entry: AdminAuditLogEntry) {
	return Object.keys(entry.metadata ?? {}).length > 0;
}

function formatAgo(ts: number) {
	const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
	return seconds < 60 ? "just now" : `${formatDuration(seconds)} ago`;
}
</script>

<template>
	<DashboardDataTable
		:data="entries?.items ?? []"
		:columns="columns"
		:loading="loading"
		:default-page-size="100"
		:show-pagination="paginated"
		:show-page-size-selector="paginated"
		:empty-title="emptyTitle"
		:empty-description="emptyDescription"
		empty-icon="i-lucide-scroll-text"
		@refresh="refresh()"
	>
		<template v-if="$slots.filters || title" #header-left>
			<slot name="filters">
				<div>
					<h3 class="font-medium text-white">{{ title }}</h3>
					<p v-if="description" class="text-sm text-slate-400">{{ description }}</p>
				</div>
			</slot>
		</template>

		<template v-if="$slots.actions" #header-right>
			<slot name="actions" />
		</template>

		<template #expand-cell="{ row }">
			<UButton
				v-if="hasMetadata(row.original)"
				icon="i-lucide-chevron-right"
				color="neutral"
				variant="ghost"
				size="xs"
				:aria-label="row.getIsExpanded() ? 'Hide details' : 'Show details'"
				:class="['transition-transform', { 'rotate-90': row.getIsExpanded() }]"
				@click="row.toggleExpanded();"
			/>
		</template>

		<template #created_at-cell="{ row }">
			<div class="whitespace-nowrap">
				<p class="text-sm text-slate-200">{{ formatDate(row.original.created_at) }}</p>
				<p class="text-xs text-slate-500">{{ formatAgo(row.original.created_at) }}</p>
			</div>
		</template>

		<template #actor-cell="{ row }">
			<NuxtLink
				v-if="row.original.actor_user_id"
				:to="`/dashboard/admin/users/${row.original.actor_user_id}`"
				class="font-medium text-primary-400 hover:underline"
			>
				{{ row.original.actor_username ?? `#${row.original.actor_user_id}` }}
			</NuxtLink>
			<span v-else class="text-sm text-slate-500">System</span>
		</template>

		<template #action-cell="{ row }">
			<div class="flex flex-col items-start gap-1">
				<UBadge :color="actionColor(row.original.action)" variant="soft">
					{{ actionLabel(row.original.action) }}
				</UBadge>
				<span class="font-mono text-xs text-slate-500">{{ row.original.action }}</span>
			</div>
		</template>

		<template #target-cell="{ row }">
			<div class="flex min-w-0 items-center gap-2">
				<UTooltip :text="TARGET_TYPES[row.original.target_type]?.label ?? row.original.target_type">
					<UIcon
						:name="TARGET_TYPES[row.original.target_type]?.icon ?? 'i-lucide-circle'"
						class="size-4 shrink-0 text-slate-400"
					/>
				</UTooltip>
				<NuxtLink
					v-if="targetLink(row.original)"
					:to="targetLink(row.original) ?? undefined"
					class="truncate font-medium text-primary-400 hover:underline"
				>
					{{ targetLabel(row.original) }}
				</NuxtLink>
				<span v-else class="truncate text-slate-300">{{ targetLabel(row.original) }}</span>
			</div>
		</template>

		<template #expanded="{ row }">
			<pre
				class="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-slate-800 bg-slate-950/60 p-3 font-mono text-xs text-slate-300"
			>{{ JSON.stringify(row.original.metadata, null, 2) }}</pre>
		</template>

		<template v-if="paginated" #footer-left>
			<AdminPageSizeSelect v-model:page-size="pageSize" :page="page" :total="entries?.total ?? 0" />
		</template>

		<template v-if="paginated" #footer-right>
			<UPagination
				v-model:page="page"
				:total="entries?.total ?? 0"
				:items-per-page="pageSize"
				:sibling-count="1"
				show-edges
			/>
		</template>
	</DashboardDataTable>
</template>
