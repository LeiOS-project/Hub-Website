/**
 * Type aliases for the admin area (`pages/dashboard/admin/**`, `components/admin/**`), derived from
 * the generated API client. Import them explicitly: `import type { AdminUser } from "~/utils/adminTypes"`.
 */
import type {
	GetAdminAuditLogData,
	GetAdminAuditLogResponses,
	GetAdminOsReleasesResponses,
	GetAdminPublishersResponses,
	GetAdminReportsResponses,
	GetAdminStablePromotionRequestsResponses,
	GetAdminStatsResponses,
	GetAdminTasksResponses,
	GetAdminUsersByUserIdPublishersResponses,
	GetAdminUsersResponses,
	GetPackagesByFullPackageNameReleasesByVersionWithLeiosPatchResponses,
	GetPackagesResponses,
	PostAdminUsersByUserIdPasswordResetLinkResponses,
} from "~/api-client";

/** One page of a paginated admin list (`GET …?limit&offset` → `{ items, total }`). */
export type AdminPage<T> = { items: T[]; total: number };

/** `order` query parameter of the admin lists. */
export type AdminListOrder = "newest" | "oldest";

export type AdminStats = GetAdminStatsResponses["200"]["data"];

export type AdminUser = GetAdminUsersResponses["200"]["data"]["items"][number];
export type AdminUserRole = AdminUser["role"];
export type AdminUserStatus = AdminUser["status"];
export type AdminUserPublisher = GetAdminUsersByUserIdPublishersResponses["200"]["data"][number];
export type AdminPasswordResetLink = PostAdminUsersByUserIdPasswordResetLinkResponses["201"]["data"];

export type AdminPublisher = GetAdminPublishersResponses["200"]["data"]["items"][number];

export type AdminPackage = GetPackagesResponses["200"]["data"]["items"][number];
export type AdminPackageFlag = AdminPackage["flags"][number];
export type AdminPackageSort = "name" | "newest" | "updated";
export type AdminPackageRelease =
	GetPackagesByFullPackageNameReleasesByVersionWithLeiosPatchResponses["200"]["data"];

export type AdminReport = GetAdminReportsResponses["200"]["data"]["items"][number];
export type AdminReportStatus = AdminReport["status"];
export type AdminReportTargetType = AdminReport["target_type"];
export type AdminReportReason = AdminReport["reason"];

export type AdminAuditLogEntry = GetAdminAuditLogResponses["200"]["data"]["items"][number];
export type AdminAuditTargetType = AdminAuditLogEntry["target_type"];
export type AdminAuditLogQuery = NonNullable<GetAdminAuditLogData["query"]>;

export type AdminTask = GetAdminTasksResponses["200"]["data"]["items"][number];
export type AdminTaskStatus = AdminTask["status"];

export type AdminStableRequest =
	GetAdminStablePromotionRequestsResponses["200"]["data"]["items"][number];
export type AdminStableRequestStatus = AdminStableRequest["status"];

export type AdminOSRelease = GetAdminOsReleasesResponses["200"]["data"]["items"][number];
export type AdminOSReleaseStatus = AdminOSRelease["publishing_status"];
