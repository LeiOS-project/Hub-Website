<script setup lang="ts">
import { zPostAccountApikeysData } from '~/api-client/zod.gen';


const toast = useToast();

const apiKey = useSubrouterInjectedData<APIKey, NewAPIKey>("api_key", true).inject();
const apiKey_data = apiKey.data;
const apiKey_loading = apiKey.loading;

const apiKey_form_schema = apiKey.isNew ? zPostAccountApikeysData.shape.body : null;
const apiKey_form_state = ref<NewAPIKey>({
    description: apiKey_data.value.description,
    expires_at: apiKey_data.value.expires_at as any
})


async function onFormSubmit() {

	apiKey_loading.value = true;

	try {

		if (apiKey.isNew) {
			const result = await useAPI((api) => api.postAccountApikeys({
				body: {
                    description: apiKey_form_state.value.description,
                    expires_at: apiKey_form_state.value.expires_at
				}
			}));

			if (result.success) {
				toast.add({
					title: 'API Key created',
					description: 'The API Key has been successfully created.',
					icon: 'i-lucide-check',
					color: 'success'
				})

				// Redirect to the newly created ÁPI Key page
				// navigateTo(`/dashboard/apikeys/${result.data?.id}`);
                navigateTo(`/dashboard/apikeys`);
			} else {
				throw new Error(result.message || 'Failed to create API Key');
			}

		} else {

            toast.add({
                title: 'API Key update not implemented',
                description: 'Updating API Keys is not yet implemented.',
                icon: 'i-lucide-info',
                color: 'info'
            });
			
			// const result = await useAPI((api) => api.putAccountApikeysId({
			// 	path: {
			// 		id: (apiKey_data as Ref<APIKey>).value.id
			// 	},
			// 	body: {
			// 		description: apiKey_form_state.value.description,
            //         expires_at: apiKey_form_state.value.expires_at
			// 	}
			// }));

			// if (result.success) {
			// 	apiKey_data.value.description = apiKey_form_state.value.description;
            //     apiKey_data.value.expires_at = apiKey_form_state.value.expires_at;

			// 	toast.add({
			// 		title: 'API Key updated',
			// 		description: 'The API Key has been successfully updated.',
			// 		icon: 'i-lucide-check',
			// 		color: 'success'
			// 	})
			// } else {
			// 	throw new Error(result.message || 'Failed to update API Key');
			// }

		}
	} catch (error: any) {
		toast.add({
			title: 'Error',
			description: error.message || 'An unexpected error occurred.',
			icon: 'i-lucide-alert-circle',
			color: 'error'
		})
	} finally {
		apiKey_loading.value = false
	}
	
}

const headerTexts = computed(() => {
    if (apiKey.isNew) {
        return {
            title: "Create New API Key",
            description: "Create a new API Key on LeiOS Hub.",
        };
    }
    return {
        title: `API Key ${(apiKey_data as Ref<APIKey>).value.id}`,
        description: "View and manage the details of the API Key.",
    };
});

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
						<h3 class="font-medium text-white">API Key Information</h3>
						<p class="text-sm text-slate-400">View and manage the details of this API Key.</p>
					</div>
				</div>
			</div>
			
			<div class="p-6">
				<UForm id="settings" class="divide-y divide-slate-800" :schema="apiKey_form_schema" :state="apiKey_form_state" @submit="onFormSubmit()">

					<UFormField
                        name="description"
                        label="Description"
                        description="The description for this API Key."
                        class="flex justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
                        :ui="{
                            container: 'w-full',
                        }"
                    >
                        <UTextarea
                            v-model="apiKey_form_state.description"
                            placeholder="No description provided."
                            :rows="5"
                            autoresize
                            class="w-full"
                        />
                    </UFormField>

                    <UFormField
                        name="expires_at"
                        label="Expiration Date"
                        description="The date and time when this API Key will expire. Leave blank for no expiration."
                        class="flex justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
                        :ui="{
                            container: 'w-full sm:w-60',
                        }"
                    >
                        <USelect
                            v-model="apiKey_form_state.expires_at"
                            placeholder="Select expiration date"
                            class="w-full"
                            :items='[
                                { label: "7 Days", value: "7d" },
                                { label: "30 Days", value: "30d" },
                                { label: "90 Days", value: "90d" },
                                { label: "180 Days", value: "180d" },
                                { label: "365 Days", value: "365d" },
                                { label: "No Expiration", value: null }
                            ]'
                        />
                    </UFormField>

                    <div class="pt-4">
						<UButton v-if="!apiKey.isNew"
							label="Save Changes" 
							color="primary"
							type="submit" 
							:loading="apiKey_loading"
							icon="i-lucide-save"
						/>
						<UButton v-else
							label="Create API Key" 
							color="primary"
							type="submit" 
							:loading="apiKey_loading"
							icon="i-lucide-plus-circle"
						/>
					</div>

				</UForm>
			</div>
		</div>

	</div>
</template>
