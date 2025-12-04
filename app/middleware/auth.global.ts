import { UserStore } from "~/utils/stores/userStore";

export default defineNuxtRouteMiddleware(async(to) => {

    const token = useCookie("session_token").value;

    if (to.path.startsWith('/auth')) {
        if (!token) {
            return;
        }

        await UserStore.fetchAndSetIfNeeded();

        return navigateTo('/');
    }

    if (!token) {
        return navigateTo('/auth/login?url=' + encodeURIComponent(to.fullPath));
    }

    await UserStore.fetchAndSetIfNeeded();
});