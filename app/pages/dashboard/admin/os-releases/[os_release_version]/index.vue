<script lang="ts" setup>
/** The new-release form (`/new`) or the details of one OS release. */
import type { GetAdminOsReleasesByVersionResponses } from "~/api-client";

type OSRelease = GetAdminOsReleasesByVersionResponses["200"]["data"];

const os_release = useSubrouterInjectedData<OSRelease, Record<string, never>>(
	"os_release",
	true,
).inject();
</script>

<template>
	<AdminOSReleaseCreateForm v-if="os_release.isNew" />
	<AdminOSReleaseDetails
		v-else
		:release="os_release.data.value as OSRelease"
		:refresh="os_release.refresh"
	/>
</template>
