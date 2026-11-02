/**
 * Site roles: `admin` runs the Hub; `moderator` reviews reports, packages, publishers, users and
 * stable promotion requests but cannot publish OS releases or administer accounts; `developer`
 * and `user` have no site-wide rights.
 */

/** Roles that may open the moderation area (`/dashboard/admin`). */
export function isStaffRole(role: string | null | undefined): boolean {
	return role === "admin" || role === "moderator";
}

/**
 * Single source of truth for the badge color used to represent a user role,
 * so the admin user list and the settings page stay visually consistent.
 */
export function getRoleColor(
	role: string | null | undefined,
): "error" | "info" | "primary" | "neutral" {
	switch (role) {
		case "admin":
			return "error";
		case "moderator":
			return "info";
		case "developer":
			return "primary";
		default:
			return "neutral";
	}
}
