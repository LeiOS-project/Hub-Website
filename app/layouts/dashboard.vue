<script setup lang="ts">
import RepoHeader from '~/components/layout/RepoHeader.vue'
</script>

<template>
    <div class="app-layout">
        <!-- Navigation -->
        <RepoHeader />

        <!-- Main Content -->
        <UMain class="main-content">
            <slot />
        </UMain>

        <!-- Footer -->
        <Footer />
    </div>
</template>

<style scoped>
.app-layout {
    min-height: 100vh;
    background-color: rgb(2 6 23);
    color: rgb(241 245 249);
    display: flex;
    flex-direction: column;
}

.main-content {
    flex: 1;
}
</style>
