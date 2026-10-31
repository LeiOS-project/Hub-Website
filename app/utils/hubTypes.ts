/**
 * Type aliases for the public Hub pages (landing page, explore, publishers, releases) and the
 * auth pages, derived from the generated API types (docs/07-state-and-data.md, `utils/types.ts`).
 */
import type {
	GetMetaResponses,
	GetMetaStatsResponses,
	GetOsReleasesResponses,
	GetPackagesByFullPackageNameReleasesResponses,
	GetPackagesData,
	GetPackagesResponses,
	GetPublishersByPublisherNameMembersResponses,
	GetPublishersResponses,
	PostReportsData,
} from "~/api-client";

/** `GET /meta`: which optional server features are on. */
export type HubServerMeta = GetMetaResponses["200"]["data"];
/** `GET /meta/stats`: public counters for the landing page. */
export type HubStats = GetMetaStatsResponses["200"]["data"];

type GeneratedPublicPackage = GetPackagesResponses["200"]["data"]["items"][number];

/**
 * A package as `GET /packages` and `GET /packages/:fullname` return it. The generator types the
 * view's computed columns as `unknown`; these are their real types (`packages_full_view`).
 */
export type PublicPackage = Omit<
	GeneratedPublicPackage,
	"last_release_at" | "publisher_display_name" | "publisher_verified_at"
> & {
	last_release_at: number | null;
	publisher_display_name: string | null;
	publisher_verified_at: number | null;
};

export type PublicPackageQuery = NonNullable<GetPackagesData["query"]>;
export type PublicPackageSort = NonNullable<PublicPackageQuery["sort"]>;
export type PublicPackageChannel = NonNullable<PublicPackageQuery["channel"]>;
/** Latest version per architecture in one repository (`latest_stable_release`, …). */
export type PublicPackageChannelVersions = PublicPackage["latest_stable_release"];

export type PublicPackageRelease =
	GetPackagesByFullPackageNameReleasesResponses["200"]["data"][number];

export type PublicPublisher = GetPublishersResponses["200"]["data"]["items"][number];
export type PublicPublisherMember =
	GetPublishersByPublisherNameMembersResponses["200"]["data"][number];

export type PublicOSRelease = GetOsReleasesResponses["200"]["data"]["items"][number];

export type NewReport = NonNullable<PostReportsData["body"]>;
export type ReportTargetType = NewReport["target_type"];
export type ReportReason = NewReport["reason"];
