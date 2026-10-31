<script setup lang="ts">
/**
 * Renderless provider for `GET /meta` (which optional server features are on). Every instance
 * shares the `hub-meta` async-data entry, so the header, the auth pages and the landing page
 * fetch it once per page load:
 *
 *   <HubMetaProvider v-slot="{ signupEnabled }">
 *     <UButton v-if="signupEnabled" to="/auth/signup">Sign up</UButton>
 *   </HubMetaProvider>
 */
import type { HubServerMeta } from "~/utils/hubTypes";

defineSlots<{
	default?: (props: {
		meta: HubServerMeta | null;
		signupEnabled: boolean;
		emailEnabled: boolean;
	}) => unknown;
}>();

const { data: meta } = await useAPIAsyncData<HubServerMeta | null>("hub-meta", async () => {
	const res = await useAPI((api) => api.getMeta({}), true);
	return res.success ? res.data : null;
});
</script>

<template>
	<slot
		:meta="meta"
		:signup-enabled="meta?.signup_enabled === true"
		:email-enabled="meta?.email_enabled === true"
	/>
</template>
