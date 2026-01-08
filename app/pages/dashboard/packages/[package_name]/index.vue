<script setup lang="ts">
import type { GetDevPackagesPackageNameResponses, PostDevPackagesData } from '@/api-client/types.gen'
import { zPostDevPackagesData, zPutDevPackagesPackageNameData } from '~/api-client/zod.gen';
type DevPackage = GetDevPackagesPackageNameResponses[200]['data'];
type NewDevPackage = NonNullable<PostDevPackagesData['body']>;

const route = useRoute()
const toast = useToast()

const pkg = useSubrouterInjectedData<DevPackage, NewDevPackage>("package", true).inject();
const pkg_data = pkg.data;
const pkg_loading = pkg.loading;

const headerTexts = computed(() => {
	if (pkg.isNew) {
		return {
			title: 'Create New Package',
            description: 'Create a new package on LeiOS Hub.'
		}
	}
	return {
		title: `Package ${(pkg_data as Ref<DevPackage>).value.name}`,
		description: 'View and manage the details of the package.'
	}
});

const package_form_schema = zPostDevPackagesData.shape.body;
const package_form_state = computed({
    get: () => ({
        name: pkg_data.value.name,
        description: pkg_data.value.description,
        homepage_url: pkg_data.value.homepage_url,
        requires_patching: pkg_data.value.requires_patching || false,
    }),
    set: (newState) => {
        pkg_data.value.name = newState.name;
        pkg_data.value.description = newState.description;
        pkg_data.value.homepage_url = newState.homepage_url;
        pkg_data.value.requires_patching = newState.requires_patching;
    }
});


async function onFormSubmit() {
	try {
		if (pkg.isNew) {
			const result = await useAPI((api) => api.postDevPackages({
				body: package_form_state.value
			}));

			if (result.success && result.data) {
				toast.add({
					title: 'Package created',
					description: `The Package has been successfully created.`,
					icon: 'i-lucide-check',
					color: 'success'
				});

				// Redirect to the new package page
				await navigateTo(`/dashboard/packages/${pkg_data.value.name}`);
			} else {
				throw new Error(result.message || 'Failed to create package');
			}
		} else {
			// Update existing package logic here (not implemented)
			toast.add({
				title: 'Update not implemented',
				description: 'Updating existing packages is not yet implemented.',
				icon: 'i-lucide-info',
				color: 'info'
			});
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

const deleteLoading = ref(false);
const deleteConfirmOpen = ref(false);
const deleteConfirmText = ref('');

async function onDeletePackage() {
	toast.add({
		title: 'Package deletion is not yet implemented.',
		description: 'This feature is coming soon.',
		icon: 'i-lucide-info',
		color: 'info'
	});
}

</script>

<template>
    
    <div class="space-y-6 w-full lg:w-3xl mx-auto">
		<!-- Header -->
		<div>
			<h2 class="text-xl font-semibold text-white">
				{{ headerTexts.title }}
			</h2>
			<p class="text-sm text-slate-400 mt-1">
				{{ headerTexts.description }}
			</p>
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
				<UForm id="settings" class="divide-y divide-slate-800" :schema="package_form_schema" :state="package_form_state" @submit="onFormSubmit()">
					<UFormField 
						name="name" 
						label="Package Name"
						description="The name of this package."
						required
						class="flex max-sm:flex-col justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
					>
						<UInput :model-value="pkg_data.name" disabled variant="none" placeholder="Enter package name" :ui="{
                            base: 'w-full text-end sm:text-center sm:w-96 font-bold text-xl px-0 text-info'
                        }" />
					</UFormField>

                    <UFormField
                        name="description"
                        label="Description"
                        description="The description for this package."
                        class="flex justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
                        :ui='{
                            container: "w-full"
                        }'
                    >
						<UTextarea 
                            v-model="pkg_data.description"
                            placeholder="No description provided."
                            :rows="5"
                            autoresize
                            class="w-full"
                        />
                    </UFormField>

                    <div class="pt-4">
						<UButton v-if="!pkg.isNew"
							label="Save Changes" 
							color="primary"
                            disabled
							type="submit" 
							:loading="pkg_loading"
							icon="i-lucide-save"
						/>
						<UButton v-else
							label="Create Package" 
							color="primary"
							type="submit" 
							:loading="pkg_loading"
							icon="i-lucide-plus-circle"
						/>
					</div>

				</UForm>
			</div>
		</div>

        <!-- Danger Zone Card -->
		<div v-if="!pkg.isNew" class="rounded-xl border border-red-900/50 bg-red-950/20 backdrop-blur-sm overflow-hidden">
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
			v-if="!pkg.isNew"
			v-model:open="deleteConfirmOpen"
			title="Delete Package"
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
						@click="onDeletePackage"
					/>
				</div>
			</div>
		</DashboardModal>

	</div>

</template>
