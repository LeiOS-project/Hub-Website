<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
import { useRuntimeAppConfigs } from "~/composables/useRuntimeAppConfigs";

const isSignupEnabled = useRuntimeAppConfigs().isSignupEnabled;

definePageMeta({
    layout: 'auth'
});

useSeoMeta({
    title: "Forgot Password | LeiOS Hub",
    description: "Reset your password",
});

const toast = useToast();

const fields: AuthFormField[] = [
    {
        name: "email",
        type: "email",
        label: "Email Address",
        placeholder: "Enter your email address",
        required: true,
    },
];

const schema = z.object({
    email: z.email("Invalid email address").trim(),
});

type Schema = z.output<typeof schema>;

async function onSubmit(_payload: FormSubmitEvent<Schema>) {
    toast.add({
        title: "Coming Soon",
        description: "The password reset request feature is not yet implemented.",
        icon: "i-lucide-info",
        color: "warning",
    });
}
</script>

<template>
    <UAuthForm
        :schema="schema"
        title="Forgot Password"
        description="Reset your password by entering your email address below."
        icon="i-lucide-mail"
        :fields="fields"
        @submit="onSubmit"
        :submit="{
            label: 'Send Reset Link',
        }"
    >
        <template #footer>
            <div class="text-center text-sm">
                Remembered your password?
                <NuxtLink
                    to="/auth/login"
                    class="text-sky-400 hover:underline"
                >
                    Login here
                </NuxtLink>
            </div>
        </template>
    </UAuthForm>
</template>
