/**
 * Labels, colors and icons for the stable promotion lifecycle (pending → queued → released, or
 * denied), shared by the public pages, the publisher dashboard and the admin area.
 */
import type {
	GetAdminStablePromotionRequestsByStablePromotionRequestIdMessagesResponses,
	GetPackagesByFullPackageNameReleasesResponses,
	ListReleaseStablePromotionRequestsResponses,
} from "~/api-client";

export type StablePromotion = NonNullable<
	GetPackagesByFullPackageNameReleasesResponses["200"]["data"][number]["stable_promotion"]
>;
export type StablePromotionStatus = StablePromotion["status"];

/** A stable promotion request as the release's (public) route returns it. */
export type StableRequest = ListReleaseStablePromotionRequestsResponses["200"]["data"][number];

/** One entry of a request's conversation: a comment or a status change. */
export type StableRequestMessage =
	GetAdminStablePromotionRequestsByStablePromotionRequestIdMessagesResponses["200"]["data"][number];

type BadgeColor = "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";

export interface StableStatusMeta {
	/** Short label for badges. */
	label: string;
	/** What the status means, for tooltips and hints. */
	description: string;
	color: BadgeColor;
	icon: string;
	/** Text color class matching `color`. */
	textClass: string;
}

export const STABLE_STATUS_META: Record<StablePromotionStatus, StableStatusMeta> = {
	pending: {
		label: "Awaiting review",
		description: "Stable promotion was requested and waits for a moderator.",
		color: "warning",
		textClass: "text-warning",
		icon: "i-lucide-clock",
	},
	queued: {
		label: "Queued for stable",
		description: "Approved: it moves into stable with the next LeiOS release.",
		color: "info",
		textClass: "text-info",
		icon: "i-lucide-list-ordered",
	},
	released: {
		label: "Released",
		description: "Moved into stable with a LeiOS release.",
		color: "success",
		textClass: "text-success",
		icon: "i-lucide-circle-check",
	},
	denied: {
		label: "Denied",
		description: "A moderator declined the stable promotion.",
		color: "error",
		textClass: "text-error",
		icon: "i-lucide-circle-x",
	},
};

/** Filter options for status selects; `all` shows every status. */
export const STABLE_STATUS_FILTER_ITEMS: { label: string; value: StablePromotionStatus | "all" }[] =
	[
		{ label: "All statuses", value: "all" },
		{ label: "Awaiting review", value: "pending" },
		{ label: "Queued for stable", value: "queued" },
		{ label: "Released", value: "released" },
		{ label: "Denied", value: "denied" },
	];

/** Badge label, naming the OS release for released requests. */
export function stableStatusLabel(status: StablePromotionStatus, osReleaseVersion?: string | null) {
	if (status === "released" && osReleaseVersion) return `Released in LeiOS ${osReleaseVersion}`;
	return STABLE_STATUS_META[status].label;
}

/** What a reviewer's status change means, for the conversation and confirmation texts. */
export const STABLE_STATUS_CHANGE_TEXT: Record<StablePromotionStatus, string> = {
	pending: "set the request back to review",
	queued: "approved the release and queued it for stable",
	released: "moved the release into stable",
	denied: "denied the request",
};
