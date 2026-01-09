<script setup lang="ts">
import type {
    GetDevPackagesPackageNameResponses,
    PostDevPackagesData,
} from "@/api-client/types.gen";
import type z from "zod";
import {
    zPostDevPackagesData,
    zPutDevPackagesPackageNameData,
} from "~/api-client/zod.gen";
import DashboardDeleteModal from "~/components/dashboard/DashboardDeleteModal.vue";
type DevPackage = GetDevPackagesPackageNameResponses[200]["data"];
type NewDevPackage = NonNullable<PostDevPackagesData["body"]>;

const route = useRoute();
const toast = useToast();

const pkg = useSubrouterInjectedData<DevPackage, NewDevPackage>(
    "package",
    true
).inject();
const pkg_data = pkg.data;
const pkg_loading = pkg.loading;

const headerTexts = computed(() => {
    if (pkg.isNew) {
        return {
            title: "Create New Package",
            description: "Create a new package on LeiOS Hub.",
        };
    }
    return {
        title: `Package ${(pkg_data as Ref<DevPackage>).value.name}`,
        description: "View and manage the details of the package.",
    };
});

const package_form_schema = zPostDevPackagesData.shape.body;
type PackageFormSchema = NonNullable<z.infer<typeof package_form_schema>>;
const package_form_state = ref<NewDevPackage>({
    name: pkg_data.value.name,
    description: pkg_data.value.description,
    homepage_url: pkg_data.value.homepage_url,
    requires_patching: pkg_data.value.requires_patching,
});

async function onFormSubmit() {
    try {
        if (pkg.isNew) {
            const result = await useAPI((api) =>
                api.postDevPackages({
                    body: package_form_state.value,
                })
            );

            if (result.success) {
                toast.add({
                    title: "Package created",
                    description: `The Package has been successfully created.`,
                    icon: "i-lucide-check",
                    color: "success",
                });

                // Redirect to the new package page
                await navigateTo(
                    `/dashboard/packages/${package_form_state.value.name}`
                );
            } else {
                throw new Error(result.message || "Failed to create package");
            }
        } else {
            const result = await useAPI((api) =>
                api.putDevPackagesPackageName({
                    path: {
                        packageName: pkg_data.value.name,
                    },
                    body: {
                        description: package_form_state.value.description,
                        homepage_url: package_form_state.value.homepage_url,
                        requires_patching:
                            package_form_state.value.requires_patching,
                    },
                })
            );

            if (result.success) {
                pkg_data.value = package_form_state.value;

                toast.add({
                    title: "Package updated",
                    description: `The Package has been successfully updated.`,
                    icon: "i-lucide-check",
                    color: "success",
                });
            } else {
                throw new Error(result.message || "Failed to update package");
            }
        }
    } catch (error: any) {
        toast.add({
            title: "Error",
            description: error.message || "An unexpected error occurred.",
            icon: "i-lucide-x-circle",
            color: "error",
        });
    }
}

const deleteLoading = ref(false);
const deleteConfirmOpen = ref(false);
const deleteConfirmText = ref("");

async function onDeletePackage() {
    toast.add({
        title: "Package deletion is not yet implemented.",
        description: "This feature is coming soon.",
        icon: "i-lucide-info",
        color: "info",
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
        <div
            class="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden"
        >
            <div class="px-6 py-4 border-b border-slate-800">
                <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center"
                    >
                        <UIcon
                            class="w-5 h-5 text-sky-400"
                            name="i-lucide-info"
                        />
                    </div>
                    <div>
                        <h3 class="font-medium text-white">
                            Release Information
                        </h3>
                        <p class="text-sm text-slate-400">
                            View and manage the details of this OS Release.
                        </p>
                    </div>
                </div>
            </div>

            <div class="p-6">
                <UForm
                    id="settings"
                    class="divide-y divide-slate-800"
                    :schema="package_form_schema"
                    :state="package_form_state"
                    @submit="onFormSubmit()"
                >
                    <!-- <UFormField
                        name="name"
                        label="Package Name"
                        description="The name of this package."
                        required
                        class="flex max-sm:flex-col justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
                    >
                        <UInput
                            :model-value="package_form_state.name"
                            :disabled="!pkg.isNew"
                            variant="none"
                            placeholder="Enter package name"
                            :ui="{
                                base: 'w-full text-end sm:text-center sm:w-96 font-bold text-xl px-0 text-info',
                            }"
                        />
                    </UFormField> -->

                    <UFormField
                        name="name"
                        label="Package Name"
                        description="The name of this package."
                        class="flex max-sm:flex-col justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
                        :ui="{
                            root: 'w-full sm:w-auto',
                            container: 'w-full sm:w-auto',
                        }"
                    >
                        <UInput
                            v-model="package_form_state.name"
                            :disabled="!pkg.isNew"
                            placeholder="Enter package name"
                            class="w-full sm:w-96"
                        />
                    </UFormField>

                    <UFormField
                        name="description"
                        label="Description"
                        description="The description for this package."
                        class="flex justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
                        :ui="{
                            container: 'w-full',
                        }"
                    >
                        <UTextarea
                            v-model="package_form_state.description"
                            placeholder="No description provided."
                            :rows="5"
                            autoresize
                            class="w-full"
                        />
                    </UFormField>

                    <UFormField
                        name="homepage_url"
                        label="Homepage URL"
                        description="Enter the homepage URL for this package."
                        class="flex max-sm:flex-col justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
                        :ui="{
                            root: 'w-full sm:w-auto',
                            container: 'w-full sm:w-auto',
                        }"
                    >
                        <UInput
                            v-model="package_form_state.homepage_url"
                            placeholder="Enter homepage URL for this package"
                            class="w-full sm:w-96"
                        />
                    </UFormField>

                    <UFormField
                        name="requires_patching"
                        label="Requires Patching"
                        description="Indicates whether this package requires every package release to include a patch suffix in its version tag."
                        required
                        class="flex justify-between items-start gap-4 py-4 first:pt-0 last:pb-0"
                    >
                        <div
                            class="w-full sm:w-96 rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors py-1.5 text-sm gap-1.5 text-highlighted bg-transparent sm:flex sm:justify-center"
                        >
                            <UCheckbox v-model="package_form_state.requires_patching" />
                        </div>
                    </UFormField>

                    <div class="pt-4">
                        <UButton
                            v-if="!pkg.isNew"
                            label="Save Changes"
                            color="primary"
                            type="submit"
                            :loading="pkg_loading"
                            icon="i-lucide-save"
                        />
                        <UButton
                            v-else
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
        <div
            v-if="!pkg.isNew"
            class="rounded-xl border border-red-900/50 bg-red-950/20 backdrop-blur-sm overflow-hidden"
        >
            <div class="px-6 py-4 border-b border-red-900/50">
                <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center"
                    >
                        <UIcon
                            name="i-lucide-alert-triangle"
                            class="w-5 h-5 text-red-400"
                        />
                    </div>
                    <div>
                        <h3 class="font-medium text-red-400">Danger Zone</h3>
                        <p class="text-sm text-slate-400">
                            Irreversible and destructive actions
                        </p>
                    </div>
                </div>
            </div>

            <div class="p-6">
                <div class="flex flex-col md:flex-row md:items-center gap-4">
                    <div class="flex-1">
                        <h4 class="font-medium text-white">
                            Delete Package
                        </h4>
                        <p class="text-sm text-slate-400 mt-1">
                            Permanently delete this package and all
                            associated data. This action cannot be undone.
                        </p>
                    </div>
                    <UButton
                        label="Delete Package"
                        color="error"
                        variant="soft"
                        icon="i-lucide-trash-2"
                        @click="deleteConfirmOpen = true"
                    />
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <DashboardDeleteModal
            v-if="!pkg.isNew"
            title="Delete Package"
            warning-text="All data associated with this package and related information will be permanently deleted. This action cannot be reversed."
            :loading="deleteLoading"
            :open="deleteConfirmOpen"
            :onDelete="onDeletePackage"
        >
        </DashboardDeleteModal>
        <!-- <DashboardModal
            v-if="!pkg.isNew"
            v-model:open="deleteConfirmOpen"
            title="Delete Package"
            description="This action is permanent"
            icon="i-lucide-alert-triangle"
            icon-color="error"
        >
            <div class="space-y-4">
                <div
                    class="p-4 rounded-lg bg-red-950/50 border border-red-900/50"
                >
                    <p class="text-sm text-red-300">
                        <strong>Warning:</strong> All data associated with this
                        package and related information
                        will be permanently deleted. This action cannot be
                        reversed.
                    </p>
                </div>

                <div>
                    <label
                        class="block text-sm font-medium text-slate-300 mb-2"
                    >
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
                        @click="
                            deleteConfirmOpen = false;
                            deleteConfirmText = '';
                        "
                    />
                    <UButton
                        label="Delete Package"
                        color="error"
                        :loading="deleteLoading"
                        :disabled="deleteConfirmText !== 'DELETE'"
                        icon="i-lucide-trash-2"
                        @click="onDeletePackage"
                    />
                </div>
            </div>
        </DashboardModal> -->
    </div>
</template>
