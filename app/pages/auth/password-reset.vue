<script setup lang="ts">
const toast = useToast()
const sessionCookie = useCookie<string | null>('session_token')

const form = reactive({
    current_password: '',
    new_password: '',
    confirm_password: ''
})

const loading = ref(false)
const canReset = computed(() => Boolean(sessionCookie.value))

async function handleReset() {
    if (!canReset.value) {
        toast.add({ title: 'Not signed in', description: 'Please log in first.', color: 'orange' })
        return
    }
    if (!form.new_password || form.new_password !== form.confirm_password) {
        toast.add({ title: 'Passwords do not match', color: 'red' })
        return
    }

    loading.value = true
    const res = await useAPI((api) => api.putAccountPassword({ body: { current_password: form.current_password, new_password: form.new_password as any } }))
    loading.value = false

    if (res.success) {
        toast.add({ title: 'Password updated', description: res.message, color: 'green' })
        Object.assign(form, { current_password: '', new_password: '', confirm_password: '' })
    } else {
        toast.add({ title: 'Update failed', description: res.message, color: 'red' })
    }
}
</script>

<template>
    <div class="flex min-h-[75vh] items-center justify-center bg-slate-950/50 py-12">
        <UCard class="w-full max-w-xl border-slate-800 bg-slate-900/70">
            <div class="space-y-6 p-8">
                <div class="space-y-2 text-center">
                    <UBadge color="primary" variant="soft">Password reset</UBadge>
                    <h1 class="text-2xl font-bold">Reset your password</h1>
                    <p class="text-slate-400">Change your account password. Admins can also reset users in the dashboard.</p>
                </div>

                <UAlert v-if="!canReset" icon="i-lucide-info" color="neutral" variant="soft">
                    You are not signed in. Please log in to change your password.
                </UAlert>

                <UForm :state="form" @submit.prevent="handleReset" class="space-y-4">
                    <UFormGroup label="Current password" name="current">
                        <UInput v-model="form.current_password" type="password" placeholder="••••••••" />
                    </UFormGroup>
                    <UFormGroup label="New password" name="new">
                        <UInput v-model="form.new_password" type="password" />
                    </UFormGroup>
                    <UFormGroup label="Confirm new password" name="confirm">
                        <UInput v-model="form.confirm_password" type="password" />
                    </UFormGroup>
                    <UButton type="submit" color="primary" block :disabled="!canReset" :loading="loading">Save</UButton>
                </UForm>

                <p class="text-center text-sm text-slate-500">
                    Forgot your password? Contact an admin — they can reset it in the dashboard.
                </p>
            </div>
        </UCard>
    </div>
</template>
