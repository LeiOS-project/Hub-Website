import type {
    GetAccountApikeysResponses,
    GetDevPackagesPackageNameReleasesResponses,
    GetDevPackagesPackageNameStablePromotionRequestsResponses,
    GetDevPackagesResponses,
    PostAccountApikeysData,
    PostDevPackagesData,
    PostDevPackagesPackageNameReleasesData,
    PostDevPackagesPackageNameStablePromotionRequestsData
} from "~/api-client";

export namespace UtilityTypes {

    export type SomePartial<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

}

export type DevPackage = GetDevPackagesResponses["200"]["data"][number];
export type NewDevPackage = NonNullable<PostDevPackagesData["body"]>;

export type DevPackageRelease = GetDevPackagesPackageNameReleasesResponses["200"]["data"][number];
export type NewDevPackageRelease = NonNullable<PostDevPackagesPackageNameReleasesData["body"]>;


export type APIKey = GetAccountApikeysResponses["200"]["data"][number];
export type NewAPIKey = NonNullable<PostAccountApikeysData["body"]>;

export type DevPackageStablePromotionRequest = GetDevPackagesPackageNameStablePromotionRequestsResponses["200"]["data"][number];
export type NewDevPackageStablePromotionRequest = NonNullable<PostDevPackagesPackageNameStablePromotionRequestsData["body"]>;
