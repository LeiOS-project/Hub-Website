<script setup lang="ts">
import Header from '~/components/layout/Header.vue'
import Footer from '~/components/layout/Footer.vue'

</script>

<template>
    <div class="app-layout">
        <!-- Navigation -->
        <Header />

        <!-- Main Content -->
        <UMain class="main-content">
            <div class="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
                <UPageCard class="w-full max-w-md">
                    <slot />
                </UPageCard>
            </div>
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