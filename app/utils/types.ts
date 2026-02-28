import type {
    GetAccountApikeysResponses,
    GetAccountResponses,
    GetDevPackagesByPackageNameReleasesResponses,
    GetDevPackagesByPackageNameStablePromotionRequestsResponses,
    GetDevPackagesResponses,
    PostAccountApikeysData,
    PostDevPackagesData,
    PostDevPackagesByPackageNameReleasesData,
    PostDevPackagesByPackageNameStablePromotionRequestsData
} from "~/api-client";

export namespace UtilityTypes {

    export type SomePartial<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

}


export type UserInfo = GetAccountResponses["200"]["data"];

export type DevPackage = GetDevPackagesResponses["200"]["data"][number];
export type NewDevPackage = NonNullable<PostDevPackagesData["body"]>;

export type DevPackageRelease = GetDevPackagesByPackageNameReleasesResponses["200"]["data"][number];
export type NewDevPackageRelease = NonNullable<PostDevPackagesByPackageNameReleasesData["body"]>;


export type APIKey = GetAccountApikeysResponses["200"]["data"][number];
export type NewAPIKey = NonNullable<PostAccountApikeysData["body"]>;

export type DevPackageStablePromotionRequest = GetDevPackagesByPackageNameStablePromotionRequestsResponses["200"]["data"][number];
export type NewDevPackageStablePromotionRequest = NonNullable<PostDevPackagesByPackageNameStablePromotionRequestsData["body"]>;
