import { UserStore } from "~/utils/stores/userStore";

export default defineNuxtRouteMiddleware(async(to) => {

    const token = useCookie("session_token").value;

    if (to.path.startsWith('/auth')) {
        if (!token) {
            return;
        }

        await UserStore.fetchAndSetIfNeeded();

        return navigateTo('/dashboard');
    }

    if (to.path.startsWith('/dashboard')) {

        if (!token) {
            return navigateTo('/auth/login?url=' + encodeURIComponent(to.fullPath));
        }

        const user = await UserStore.use();

        if (to.path.startsWith('/dashboard/admin')) {
            // Check admin access
            if (!user || user.role !== 'admin') {
                navigateTo('/dashboard')
            }
        }

    }
});