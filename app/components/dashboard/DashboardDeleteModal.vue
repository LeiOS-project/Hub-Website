<script setup lang="ts">
import { ref } from 'vue';

const confirmText = ref("");

const props = defineProps<{
    title: string;
    warningText: string;
    loading: boolean;
    open: boolean;
    onDelete: () => Promise<void> | void;
}>();

</script>

<template>
    <DashboardModal
        v-model:open="open"
        :title="title"
        description="This action is permanent"
        icon="i-lucide-alert-triangle"
        icon-color="error"
    >
        <div class="space-y-4">
            <div class="p-4 rounded-lg bg-red-950/50 border border-red-900/50">
                <p class="text-sm text-red-300">
                    <strong>Warning:</strong>
                    {{ warningText }}
                </p>
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">
                    Type <span class="text-red-400">DELETE</span> to confirm
                </label>
                <UInput
                    v-model="confirmText"
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
                    @click="open = false; confirmText = '';"
                />
                <UButton
                    :label="title"
                    color="error"
                    :loading="loading"
                    :disabled="confirmText !== 'DELETE'"
                    icon="i-lucide-trash-2"
                    @click="onDelete"
                />
            </div>
        </div>
    </DashboardModal>
</template>
