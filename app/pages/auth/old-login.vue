<script setup lang="ts">
import { UserStore } from '~/utils/stores/userStore'

const toast = useToast()
const route = useRoute()
const router = useRouter()

const form = reactive({
    username: '',
    password: ''
})
const loading = ref(false)
const sessionCookie = useCookie<string | null>('session_token')

async function handleLogin() {
    if (!form.username || !form.password) {
        toast.add({ title: 'Missing input', description: 'Please fill username and password.', color: 'warning' })
        return
    }

    loading.value = true
    const res = await useAPI((api) => api.postAuthLogin({ body: { ...form } }), true)
    loading.value = false

    if (res.success) {
        sessionCookie.value = res.data.token
        await UserStore.fetchAndSet()
        toast.add({ title: 'Welcome back', description: res.message, color: 'success' })
        const target = (route.query.url as string) || '/dashboard'
        router.push(target)
    } else {
        toast.add({ title: 'Login failed', description: res.message, color: 'error' })
    }
}
</script>

<template>
    <div class="flex min-h-[75vh] items-center justify-center bg-slate-950/50 py-12">
        <UCard class="w-full max-w-xl border-slate-800 bg-slate-900/70 shadow-2xl">
            <div class="space-y-6 p-8">
                <div class="space-y-2 text-center">
                    <UBadge color="primary" variant="soft" class="inline-flex items-center gap-2">
                        <UIcon name="i-lucide-lock" /> Secure login
                    </UBadge>
                    <h1 class="text-3xl font-bold">LeiOS Repository</h1>
                    <p class="text-slate-400">Sign in with your developer or admin account.</p>
                </div>

                <UForm :state="form" @submit.prevent="handleLogin" class="space-y-4">
                    <UFormGroup label="Username" name="username">
                        <UInput v-model="form.username" placeholder="username" autofocus />
                    </UFormGroup>
                    <UFormGroup label="Password" name="password">
                        <UInput v-model="form.password" type="password" placeholder="••••••••" />
                    </UFormGroup>
                    <UButton type="submit" color="primary" block :loading="loading">Login</UButton>
                </UForm>

                <div class="flex items-center justify-between text-sm text-slate-400">
                    <NuxtLink to="/auth/password-reset" class="text-sky-400 hover:underline">Reset password</NuxtLink>
                    <span>No access? Contact an admin.</span>
                </div>
            </div>
        </UCard>
    </div>
</template>
