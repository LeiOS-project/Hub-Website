<script setup lang="ts">
import { refDebounced } from "@vueuse/core";
import type { AdminAuditTargetType, AdminListOrder } from "~/utils/adminTypes";

definePageMeta({
	layout: "dashboard",
});

useSeoMeta({
	title: "Audit Log | LeiOS Hub",
	description: "Review admin, publisher and moderation actions",
});

const route = useRoute();
const router = useRouter();

const ACTION_GROUP_ITEMS = [
	{ label: "All actions", value: "all" },
	{ label: "Users", value: "user." },
	{ label: "Publishers", value: "publisher." },
	{ label: "Packages", value: "package." },
	{ label: "Releases", value: "release." },
	{ label: "Stable requests", value: "stable_request." },
	{ label: "OS releases", value: "os_release." },
	{ label: "Reports", value: "report." },
];

const TARGET_TYPE_ITEMS: { label: string; value: AdminAuditTargetType | "all" }[] = [
	{ label: "All targets", value: "all" },
	{ label: "User", value: "user" },
	{ label: "Publisher", value: "publisher" },
	{ label: "Package", value: "package" },
	{ label: "Release", value: "release" },
	{ label: "Stable request", value: "stable_promotion_request" },
	{ label: "OS release", value: "os_release" },
	{ label: "Report", value: "report" },
];

const ORDER_ITEMS: { label: string; value: AdminListOrder }[] = [
	{ label: "Newest first", value: "newest" },
	{ label: "Oldest first", value: "oldest" },
];

function queryString(value: unknown) {
	return typeof value === "string" ? value : "";
}

const initialTargetType = TARGET_TYPE_ITEMS.find((i) => i.value === route.query.target_type);

// Initial values come from the URL so filtered views can be linked and survive a reload.
const filters = reactive({
	action: queryString(route.query.action) || "all",
	targetType: initialTargetType?.value ?? "all",
	order: (route.query.order === "oldest" ? "oldest" : "newest") as AdminListOrder,
	actor: queryString(route.query.actor_user_id),
	targetId: queryString(route.query.target_id),
});

// An exact action from a link ("user.suspend") is kept as an extra option.
const actionItems = computed(() =>
	ACTION_GROUP_ITEMS.some((i) => i.value === filters.action)
		? ACTION_GROUP_ITEMS
		: [...ACTION_GROUP_ITEMS, { label: filters.action, value: filters.action }],
);

const debouncedActor = refDebounced(toRef(filters, "actor"), 400);
const debouncedTargetId = refDebounced(toRef(filters, "targetId"), 400);

const action = computed(() => (filters.action === "all" ? null : filters.action));
const targetType = computed(() => (filters.targetType === "all" ? null : filters.targetType));
const actorUserId = computed(() => {
	const id = Number(debouncedActor.value.trim());
	return Number.isInteger(id) && id > 0 ? id : null;
});
const targetId = computed(() => debouncedTargetId.value.trim() || null);

const hasActiveFilters = computed(
	() =>
		action.value !== null ||
		targetType.value !== null ||
		filters.actor.trim() !== "" ||
		filters.targetId.trim() !== "" ||
		filters.order !== "newest",
);

function resetFilters() {
	filters.action = "all";
	filters.targetType = "all";
	filters.order = "newest";
	filters.actor = "";
	filters.targetId = "";
}

watch([action, targetType, actorUserId, targetId, () => filters.order], () => {
	router.replace({
		query: {
			action: action.value ?? undefined,
			target_type: targetType.value ?? undefined,
			actor_user_id: actorUserId.value ?? undefined,
			target_id: targetId.value ?? undefined,
			order: filters.order === "oldest" ? "oldest" : undefined,
		},
	});
});
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardPageHeader
				title="Audit Log"
				icon="i-lucide-scroll-text"
				description="Who did what to which resource"
			/>
		</template>

		<template #body>
			<DashboardPageBody>
				<AdminAuditLogTable
					:action="action"
					:target-type="targetType"
					:actor-user-id="actorUserId"
					:target-id="targetId"
					:order="filters.order"
					empty-description="No audit-log entries match these filters."
				>
					<template #filters>
						<USelect
							v-model="filters.action"
							:items="actionItems"
							icon="i-lucide-filter"
							class="w-full sm:w-auto sm:min-w-44"
						/>
						<USelect
							v-model="filters.targetType"
							:items="TARGET_TYPE_ITEMS"
							icon="i-lucide-crosshair"
							class="w-full sm:w-auto sm:min-w-40"
						/>
						<UInput
							v-model="filters.actor"
							inputmode="numeric"
							icon="i-lucide-user"
							placeholder="Actor user ID"
							class="w-full sm:w-36"
						/>
						<UInput
							v-model="filters.targetId"
							icon="i-lucide-hash"
							placeholder="Target ID"
							class="w-full sm:w-32"
						/>
						<USelect
							v-model="filters.order"
							:items="ORDER_ITEMS"
							class="w-full sm:w-auto sm:min-w-36"
						/>
						<UButton
							v-if="hasActiveFilters"
							label="Reset"
							icon="i-lucide-x"
							color="neutral"
							variant="ghost"
							@click="resetFilters();"
						/>
					</template>
				</AdminAuditLogTable>
			</DashboardPageBody>
		</template>
	</UDashboardPanel>
</template>
