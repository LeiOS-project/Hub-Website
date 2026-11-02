/**
 * auth.global.ts — session-aware route guard.
 *
 * Tune the constants below:
 * - `/auth/*` is for signed-out users; a valid session is sent on to `HOME_ROUTE`, except on the
 *   `AUTH_ROUTES_FOR_EVERYONE` (e.g. the confirmation link from an email, opened while signed in).
 * - `PROTECTED_PREFIXES` need a valid session, otherwise → `/auth/login?url=…`.
 * - `ADMIN_PREFIXES` additionally need `role === "admin"`, otherwise → `HOME_ROUTE`.
 * - `PUBLIC_ROUTES` are exceptions inside a protected prefix (`[param]` segments supported).
 * - `ONBOARDING_ROUTE` needs a session; with `REQUIRE_ONBOARDING`, signed-in users who haven't
 *   completed it are sent there before any other protected page.
 * - Everything else (landing page, explore, publishers, releases) is public.
 *
 * See docs/10-auth.md of the LeiCraftMC style guide.
 */
import { useUserInfoStore } from "~/composables/stores/useUserStore";

const HOME_ROUTE = "/dashboard";
const PROTECTED_PREFIXES = ["/dashboard"];
const ADMIN_PREFIXES = ["/dashboard/admin"];
const PUBLIC_ROUTES: string[] = [];
const AUTH_ROUTES_FOR_EVERYONE = ["/auth/verify-email"];
const ONBOARDING_ROUTE = "/welcome";
// The Hub has no onboarding yet. To switch it on, add the style guide's
// composables/stores/useOnboardingStore.ts and a /welcome page, set this to `true` and restore the
// store calls in the gate below.
const REQUIRE_ONBOARDING = false;

function hasPrefix(path: string, prefixes: string[]) {
	return prefixes.some(
		(prefix) => prefix === "/" || path === prefix || path.startsWith(`${prefix}/`),
	);
}

export default defineNuxtRouteMiddleware(async (to) => {
	const sessionToken = useAppCookies().sessionToken;
	const token = sessionToken.get().value;
	const store = useUserInfoStore();

	if (hasPrefix(to.path, ["/auth"])) {
		if (!token) return;
		if (SimpleRouteMatcher.match(to.path, AUTH_ROUTES_FOR_EVERYONE)) return;
		if (store.isValid(await store.use())) return navigateTo(HOME_ROUTE);

		// Token exists but is invalid or expired: clear it and stay on the auth page.
		sessionToken.set(null);
		return;
	}

	const protectedPrefixes = REQUIRE_ONBOARDING
		? [...PROTECTED_PREFIXES, ONBOARDING_ROUTE]
		: PROTECTED_PREFIXES;
	if (!hasPrefix(to.path, protectedPrefixes)) return;
	if (SimpleRouteMatcher.match(to.path, PUBLIC_ROUTES)) return;

	const loginRoute = `/auth/login?url=${encodeURIComponent(to.fullPath)}`;
	if (!token) return navigateTo(loginRoute);

	const user = await store.use();
	if (!store.isValid(user)) {
		sessionToken.set(null);
		return navigateTo(loginRoute);
	}

	// First-login gate. `/welcome` itself is excluded so it never redirect-loops; the welcome
	// page marks onboarding complete when the user finishes or skips it.
	if (REQUIRE_ONBOARDING && to.path !== ONBOARDING_ROUTE) {
		// const onboardingStore = useOnboardingStore();
		// await onboardingStore.refreshIfNeeded();
		// if (!onboardingStore.completed.value) {
		// 	return navigateTo(ONBOARDING_ROUTE);
		// }
	}

	if (hasPrefix(to.path, ADMIN_PREFIXES) && user.value.role !== "admin") {
		return navigateTo(HOME_ROUTE);
	}
});
