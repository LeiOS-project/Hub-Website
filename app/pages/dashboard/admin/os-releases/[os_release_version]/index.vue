<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui';
import type { GetAdminOsReleasesResponses } from '~/api-client';

const toast = useToast();
const route = useRoute();

const os_release_version = route.params.os_release_version as string;

const title = `Release ${os_release_version} | OS Releases`;

type OSRelease = GetAdminOsReleasesResponses["200"]["data"][number];

useSeoMeta({
    title: `${title} | LeiOS Hub`,
    description: 'Manage OS Releases on LeiOS Hub'
});

const os_release = inject<Ref<OSRelease>>('os_release_data') as Ref<OSRelease>;
const os_release_refresh = inject<() => Promise<void>>('os_release_refresh');
const os_release_pending = inject<Ref<boolean>>('os_release_pending');

function getPublishingStatusColor(status: OSRelease['publishing_status']) {
    switch (status) {
        case 'pending':
            return 'warning'
        case 'paused':
            return 'warning'
        case 'completed':
            return 'success'
        case 'failed':
            return 'error'
        case 'running':
            return 'info'
    }
}

const deleteLoading = ref(false);
const deleteConfirmOpen = ref(false);
const deleteConfirmText = ref('');

async function onDeleteOSRelease() {

    toast.add({
        title: 'OS Release deletion not implemented',
        description: 'The deletion of OS Releases is not yet implemented.',
        icon: 'i-lucide-alert-triangle',
        color: 'warning'
    });

    deleteLoading.value = false;
	deleteConfirmOpen.value = false;

    return;

	if (deleteConfirmText.value !== 'DELETE') {

		toast.add({
			title: 'Confirmation required',
			description: 'Please type DELETE to confirm OS Release deletion.',
			icon: 'i-lucide-alert-triangle',
			color: 'warning'
		})
		return;
	}

	deleteLoading.value = true;

	// try {
	// 	// const result = await useAPI((api) => api.deleteOSRelease({}))

	// 	if (result.success) {
	// 		toast.add({
	// 			title: 'OS Release deleted',
	// 			description: 'The OS Release has been permanently deleted.',
	// 			icon: 'i-lucide-check',
	// 			color: 'success'
	// 		})

	// 		UserStore.clear()
	// 		useCookie('session_token').value = null
	// 		navigateTo('/')
	// 	} else {
	// 		toast.add({
	// 			title: 'Error',
	// 			description: result.message || 'An error occurred while deleting the OS Release.',
	// 			icon: 'i-lucide-alert-circle',
	// 			color: 'error'
	// 		})
	// 	}
	// } catch (error) {
	// 	toast.add({
	// 		title: 'Error',
	// 		description: 'An unexpected error occurred.',
	// 		icon: 'i-lucide-alert-circle',
	// 		color: 'error'
	// 	})
	// } finally {
	// 	deleteLoading.value = false
	// 	deleteConfirmOpen.value = false
	// }
}

</script>

<template>
    <div class="space-y-6 lg:max-w-3xl mx-auto">
		<!-- Header -->
		<div>
			<h2 class="text-xl font-semibold text-white">OS Release {{ os_release?.version }}</h2>
			<p class="text-sm text-slate-400 mt-1">View and manage the details of this OS Release.</p>
		</div>

		<!-- Profile Card -->
		<div class="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
			<div class="px-6 py-4 border-b border-slate-800">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
						<UIcon class="w-5 h-5 text-sky-400" name="i-lucide-info" />
					</div>
					<div>
						<h3 class="font-medium text-white">Release Information</h3>
						<p class="text-sm text-slate-400">View and manage the details of this OS Release.</p>
					</div>
				</div>
			</div>
			
			<div class="p-6">
				<UForm id="settings" class="divide-y divide-slate-800">
					<UFormField 
						name="version" 
						label="Version"
						description="The version number of this OS Release."
						required
						class="flex justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
					>
						<UInput :model-value="os_release?.version" disabled variant="none" placeholder="Enter version" :ui="{
                            base: 'w-full text-end sm:text-center sm:w-96 font-bold text-xl px-0 text-info'
                        }" />
					</UFormField>

                    <UFormField 
                        name="publishing_status" 
                        label="Publishing Status"
                        description="The current publishing status of this OS Release."
                        required
                        class="flex justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
					>
                        <div class="w-full sm:w-96 rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors py-1.5 text-sm gap-1.5 text-highlighted bg-transparent sm:flex sm:justify-center">
                            <UBadge 
                                :label="os_release.publishing_status.toUpperCase()" 
                                :color="getPublishingStatusColor(os_release.publishing_status)"
                                size="md"
                                class="sm:w-96 max-w-max" 
                            />
                        </div>
					</UFormField>

                    <UFormField
                        name="chnagelog"
                        label="Changelog"
                        description="The changelog for this OS Release."
                        class="flex justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
                        :ui='{
                            container: "w-full"
                        }'
                    >
                        <UTextarea 
                            :model-value="'Currently not implemented.'"  
                            placeholder="No changelog provided."
                            :rows="5"
                            disabled
                            autoresize
                            class="w-full"
                        />
                    </UFormField>

                    <div class="pt-4">
						<UButton 
							label="Save Changes" 
							color="primary"
                            disabled
							type="submit" 
							:loading="os_release_pending"
							icon="i-lucide-save"
						/>
					</div>

				</UForm>
			</div>
		</div>

        <!-- Danger Zone Card -->
		<div class="rounded-xl border border-red-900/50 bg-red-950/20 backdrop-blur-sm overflow-hidden">
			<div class="px-6 py-4 border-b border-red-900/50">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
						<UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-400" />
					</div>
					<div>
						<h3 class="font-medium text-red-400">Danger Zone</h3>
						<p class="text-sm text-slate-400">Irreversible and destructive actions</p>
					</div>
				</div>
			</div>
			
			<div class="p-6">
				<div class="flex flex-col md:flex-row md:items-center gap-4">
					<div class="flex-1">
						<h4 class="font-medium text-white">Delete OS Release</h4>
						<p class="text-sm text-slate-400 mt-1">
							Permanently delete this OS Release and all associated data. This action cannot be undone.
						</p>
					</div>
					<UButton 
						label="Delete OS Release" 
						color="error" 
						variant="soft"
						icon="i-lucide-trash-2"
						@click="deleteConfirmOpen = true"
					/>
				</div>
			</div>
		</div>

		<!-- Delete Confirmation Modal -->
		<DashboardModal
			v-model:open="deleteConfirmOpen"
			title="Delete OS Release"
			description="This action is permanent"
			icon="i-lucide-alert-triangle"
			icon-color="error"
		>
			<div class="space-y-4">
				<div class="p-4 rounded-lg bg-red-950/50 border border-red-900/50">
					<p class="text-sm text-red-300">
						<strong>Warning:</strong> All the OS release data including packages, releases, and related information will be permanently deleted. This action cannot be reversed.
					</p>
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-300 mb-2">
						Type <span class="text-red-400">DELETE</span> to confirm
					</label>
					<UInput 
						v-model="deleteConfirmText" 
						type="text" 
						placeholder="Type DELETE"
						class="w-full"
					/>
				</div>

				<div class="flex justify-end gap-3 pt-2">
					<UButton 
						label="Cancel" 
						color="neutral" 
						variant="ghost"
						@click="deleteConfirmOpen = false; deleteConfirmText = ''"
					/>
					<UButton 
						label="Delete OS Release" 
						color="error"
						:loading="deleteLoading"
						:disabled="deleteConfirmText !== 'DELETE'"
						icon="i-lucide-trash-2"
						@click="onDeleteOSRelease"
					/>
				</div>
			</div>
		</DashboardModal>

	</div>
</template>
