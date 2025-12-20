import * as apiClient from "@/api-client";
import type { KeysOf } from "~/api-client/client/types.gen";

type UseAPIReturnType<TReturn> = Promise<TReturn | {
    readonly success: false;
    readonly code: 500;
    readonly message: string;
    readonly data: null;
}>;

export async function useAPI<TReturn>(handler: (api: typeof apiClient) => TReturn, isAsyncData?: false, disableAuthRedirect?: boolean): UseAPIReturnType<TReturn>;
export async function useAPI<TReturn>(handler: (api: typeof apiClient) => TReturn, isAsyncData: true, disableAuthRedirect?: boolean): UseAPIReturnType<TReturn>;
export async function useAPI<TReturn>(handler: (api: typeof apiClient) => TReturn, isAsyncData: boolean, disableAuthRedirect?: boolean): UseAPIReturnType<TReturn> 
export async function useAPI<TReturn>(handler: (api: typeof apiClient) => TReturn, isAsyncData = false, disableAuthRedirect = false): UseAPIReturnType<TReturn> {

    try {
        if (import.meta.server) {

            const { data } = await useAsyncData(async (nuxtApp) => {

                const sessionToken = useCookie("session_token");

                sessionToken.value ? updateAPIClient(sessionToken.value) : updateAPIClient(null);

                return handler(apiClient);
            });

            return data.value as TReturn ?? {
                success: false,
                code: 500,
                message: "Failed to process API request on server.",
                data: null
            } as const

        } else if (import.meta.client) {

            const sessionToken = useCookie("session_token");

            if (sessionToken.value) {
                updateAPIClient(sessionToken.value);
            } else {
                updateAPIClient(null);
                if (!disableAuthRedirect) {
                    navigateTo('/auth/login?url=' + encodeURIComponent(useRoute().fullPath));
                }
            }

            return handler(apiClient);

        } else {
            throw new Error("Unknown environment");
        }
        
    } catch (error) {
        return {
            success: false,
            code: 500,
            message: (error as Error).message ?? "An unknown error occurred.",
            data: null
        } as const;
    }
}