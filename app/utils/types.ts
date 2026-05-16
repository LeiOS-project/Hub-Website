import type {
    GetAccountApikeysResponses,
    GetAccountResponses,
    GetPackagesByFullPackageNameReleasesResponses,
    GetPackagesByFullPackageNameStablePromotionRequestsResponses,
    GetPackagesResponses,
    PostAccountApikeysData,
    PostPackagesData,
    PostPackagesByFullPackageNameReleasesData,
    PostPackagesByFullPackageNameStablePromotionRequestsData
} from "~/api-client";

export namespace UtilityTypes {

    export type SomePartial<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

}


export type UserInfo = GetAccountResponses["200"]["data"];

export type DevPackage = GetPackagesResponses["200"]["data"][number];
export type NewDevPackage = NonNullable<PostPackagesData["body"]>;

export type DevPackageRelease = GetPackagesByFullPackageNameReleasesResponses["200"]["data"][number];
export type NewDevPackageRelease = NonNullable<PostPackagesByFullPackageNameReleasesData["body"]>;


export type APIKey = GetAccountApikeysResponses["200"]["data"][number];
export type NewAPIKey = NonNullable<PostAccountApikeysData["body"]>;

export type DevPackageStablePromotionRequest = GetPackagesByFullPackageNameStablePromotionRequestsResponses["200"]["data"][number];
export type NewDevPackageStablePromotionRequest = NonNullable<PostPackagesByFullPackageNameStablePromotionRequestsData["body"]>;
