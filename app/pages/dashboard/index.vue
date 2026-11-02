<script setup lang="ts">
import type { TableColumn } from "#ui/types";
import type { GetAdminTasksResponses, GetPackagesResponses } from "@/api-client/types.gen";
import { useUserInfoStore } from "~/composables/stores/useUserStore";

type DevPackage = GetPackagesResponses[200]["data"]["items"][number];
type DevTask = GetAdminTasksResponses[200]["data"]["items"][number];

definePageMeta({
	layout: "dashboard",
});

useSeoMeta({
	title: "Dashboard | LeiOS Hub",
	description: "Manage your packages and releases",
});

const toast = useToast();

const userInfoStore = useUserInfoStore();
const user = await userInfoStore.use();
if (!userInfoStore.isValid(user)) {
	throw new Error("User not authenticated but trying to access Dashboard");
}

const isAdmin = computed(() => user.value.role === "admin");

// Fetch packages
const { data: devPackages, loading: loadingPackages } = await useAPIAsyncData<DevPackage[]>(
	"dev-packages",
	async () => {
		const res = await useAPI((api) =>
			api.getPackages({ query: { onlyMembershipByMe: "true", limit: 100 } }),
		);
		if (!res.success) {
			toast.add({ title: "Failed to load packages", description: res.message, color: "error" });
			return [];
		}
		return res.data.items;
	},
);

// Fetch tasks
const { data: devTasks, loading: loadingTasks } = await useAPIAsyncData<DevTask[]>(
	"dev-tasks",
	async () => {
		if (!isAdmin.value) {
			return [];
		}

		const res = await useAPI((api) => api.getAdminTasks({ query: { limit: 100 } }));
		if (!res.success) {
			return [];
		}
		return res.data.items;
	},
);

const packageColumns: TableColumn<DevPackage>[] = [
	{ accessorKey: "name", header: "Name" },
	{ accessorKey: "description", header: "Description" },
	{ id: "actions", header: "", enableSorting: false, enableHiding: false },
];

const recentPackages = computed(() => (devPackages.value || []).slice(0, 5));
const recentTasks = computed(() => (devTasks.value || []).slice(0, 5));

type StatCard = {
	label: string;
	value: number;
	loading: boolean;
	icon: string;
	iconColor: "primary" | "amber" | "emerald";
};

const stats = computed<StatCard[]>(() => [
	{
		label: "Total Packages",
		value: devPackages.value?.length ?? 0,
		loading: loadingPackages.value,
		icon: "i-lucide-package",
		iconColor: "primary",
	},
	...(isAdmin.value
		? ([
				{
					label: "Pending Tasks",
					value: (devTasks.value || []).filter((t) => t.status === "pending").length,
					loading: loadingTasks.value,
					icon: "i-lucide-clock",
					iconColor: "amber",
				},
				{
					label: "Running Tasks",
					value: (devTasks.value || []).filter((t) => t.status === "running").length,
					loading: loadingTasks.value,
					icon: "i-lucide-loader",
					iconColor: "emerald",
				},
			] satisfies StatCard[])
		: []),
]);
</script>

<template>
    <UDashboardPanel>
        <template #header>
            <DashboardPageHeader title="Dashboard" icon="i-lucide-layout-dashboard">
                <template #right>
                    <UButton
                        label="New Package"
                        icon="i-lucide-plus"
                        color="primary"
                        to="/dashboard/packages/new"
                    />
                </template>
            </DashboardPageHeader>
        </template>

        <template #body>
            <!-- Welcome Section -->
            <DashboardPageBody>
                <DashboardEmailVerificationNotice
                    reason="Creating publishers and reporting packages need a confirmed address."
                />

                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold">
                            Welcome back, {{ user?.display_name || user?.username }}
                        </h1>
                        <p class="text-slate-400 mt-1">
                            Here's an overview of your packages and tasks.
                        </p>
                    </div>
                    <UBadge v-if="isAdmin" color="primary" variant="soft" size="lg">
                        <UIcon name="i-lucide-shield" class="mr-1" />
                        Admin
                    </UBadge>
                </div>

                <!-- Stats Cards -->
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <DashboardStatCard
                        v-for="stat in stats"
                        :key="stat.label"
                        :label="stat.label"
                        :value="stat.value"
                        :loading="stat.loading"
                        :icon="stat.icon"
                        :icon-color="stat.iconColor"
                    />
                </div>

                <!-- Recent Packages -->
                <UCard class="border-slate-800 bg-slate-900/60">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h2 class="text-lg font-semibold flex items-center gap-2">
                                <UIcon name="i-lucide-package" class="text-sky-400" />
                                Recent Packages
                            </h2>
                            <UButton
                                label="View All"
                                variant="ghost"
                                color="neutral"
                                size="sm"
                                to="/dashboard/packages"
                                trailing-icon="i-lucide-arrow-right"
                            />
                        </div>
                    </template>

                    <div v-if="loadingPackages" class="flex items-center justify-center py-8">
                        <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-slate-400" />
                    </div>

                    <UTable
                        v-else-if="recentPackages.length"
                        :data="recentPackages"
                        :columns="packageColumns"
                    >
                        <template #name-cell="{ row }">
                            <NuxtLink
                                :to="`/dashboard/packages/${row.original.fullname}`"
                                class="font-medium text-sky-400 hover:underline"
                            >
                                {{ row.original.name }}
                            </NuxtLink>
                        </template>
                        <template #description-cell="{ row }">
                            <span class="text-slate-400 line-clamp-1">
                                {{ markdownToPlainText(row.original.description, 140) || '—' }}
                            </span>
                        </template>
                        <template #actions-cell="{ row }">
                            <UButton
                                icon="i-lucide-external-link"
                                variant="ghost"
                                color="neutral"
                                size="xs"
                                :to="`/dashboard/packages/${row.original.fullname}`"
                            />
                        </template>
                    </UTable>

                    <UEmpty
                        v-else
                        icon="i-lucide-package-x"
                        title="No packages yet"
                        description="Create your first package to get started."
                    >
                        <template #actions>
                            <UButton
                                label="Create Package"
                                color="primary"
                                to="/dashboard/packages/new"
                            />
                        </template>
                    </UEmpty>
                </UCard>

                <!-- Recent Tasks (the task list is admin-only) -->
                <UCard v-if="isAdmin" class="border-slate-800 bg-slate-900/60">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h2 class="text-lg font-semibold flex items-center gap-2">
                                <UIcon name="i-lucide-list-checks" class="text-emerald-400" />
                                Recent Tasks
                            </h2>
                            <UButton
                                label="View All"
                                variant="ghost"
                                color="neutral"
                                size="sm"
                                to="/dashboard/admin/tasks"
                                trailing-icon="i-lucide-arrow-right"
                            />
                        </div>
                    </template>

                    <div v-if="loadingTasks" class="flex items-center justify-center py-8">
                        <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-slate-400" />
                    </div>

                    <div v-else-if="recentTasks.length" class="space-y-3">
                        <div
                            v-for="task in recentTasks"
                            :key="task.id"
                            class="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-3"
                        >
                            <div class="flex items-center gap-3">
                                <UIcon
                                    :name="
                                        task.status === 'completed'
                                            ? 'i-lucide-check-circle'
                                            : task.status === 'running'
                                              ? 'i-lucide-loader'
                                              : task.status === 'failed'
                                                ? 'i-lucide-x-circle'
                                                : 'i-lucide-clock'
                                    "
                                    :class="[
                                        'text-lg',
                                        task.status === 'completed'
                                            ? 'text-emerald-400'
                                            : task.status === 'running'
                                              ? 'text-sky-400 animate-spin'
                                              : task.status === 'failed'
                                                ? 'text-red-400'
                                                : 'text-amber-400'
                                    ]"
                                />
                                <div>
                                    <p class="font-medium">Task #{{ task.id }}</p>
                                    <p class="text-sm text-slate-400">
                                        {{ task.message || 'Processing...' }}
                                    </p>
                                </div>
                            </div>
                            <UBadge
                                :color="
                                    task.status === 'completed'
                                        ? 'success'
                                        : task.status === 'running'
                                          ? 'info'
                                          : task.status === 'failed'
                                            ? 'error'
                                            : 'warning'
                                "
                                variant="soft"
                            >
                                {{ task.status }}
                            </UBadge>
                        </div>
                    </div>

                    <UEmpty
                        v-else
                        icon="i-lucide-clipboard-list"
                        title="No tasks"
                        description="Tasks will appear here when you upload releases."
                    />
                </UCard>

                <!-- Quick Actions -->
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <UCard
                        class="border-slate-800 bg-slate-900/60 transition hover:border-sky-500/50 cursor-pointer"
                        @click="navigateTo('/dashboard/packages/new')"
                    >
                        <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                                <UIcon name="i-lucide-package-plus" class="text-sky-400" />
                            </div>
                            <div>
                                <p class="font-semibold">Create Package</p>
                                <p class="text-sm text-slate-400">Add a new package</p>
                            </div>
                        </div>
                    </UCard>

                    <UCard
                        class="border-slate-800 bg-slate-900/60 transition hover:border-emerald-500/50 cursor-pointer"
                        @click="navigateTo('/dashboard/packages')"
                    >
                        <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                                <UIcon name="i-lucide-upload" class="text-emerald-400" />
                            </div>
                            <div>
                                <p class="font-semibold">Upload Release</p>
                                <p class="text-sm text-slate-400">Add a new build</p>
                            </div>
                        </div>
                    </UCard>

                    <UCard
                        v-if="isAdmin"
                        class="border-slate-800 bg-slate-900/60 transition hover:border-amber-500/50 cursor-pointer"
                        @click="navigateTo('/dashboard/admin/stable-promotion-requests')"
                    >
                        <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                                <UIcon name="i-lucide-git-pull-request" class="text-amber-400" />
                            </div>
                            <div>
                                <p class="font-semibold">Review Requests</p>
                                <p class="text-sm text-slate-400">Approve stable promotions</p>
                            </div>
                        </div>
                    </UCard>
                </div>
            </DashboardPageBody>
        </template>
    </UDashboardPanel>
</template>
