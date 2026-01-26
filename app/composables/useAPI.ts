import * as baseAPIClient from "@/api-client/sdk.gen";

export namespace UseAPITypes {

    export type APIClient = typeof baseAPIClient;

    export type DefaultReturn<TReturn> = TReturn;

    export type UseAPIReturnType<TReturn> = Promise<TReturn | {
        readonly success: false;
        readonly code: 500;
        readonly message: string;
        readonly data: null;
    }>;

    export type AsyncDataReturn<TReturn> = {
        data: Ref<DefaultReturn<TReturn>>;
        loading: Ref<boolean>;
        refresh: () => Promise<void>;
    }

    export type LazyAsyncDataReturn<TReturn> = {
        data: Ref<DefaultReturn<TReturn>>;
        loading: Ref<boolean>;
        refresh: () => Promise<void>;
    }

    export type AsyncRequestTaskReturn<TReturn> = AsyncRequestTaskWrapper<TReturn>;

}

class AsyncRequestTaskWrapper<TReturn> {

    readonly loading = ref(false);

    constructor(
        protected readonly handler: () => Promise<TReturn>
    ) {}

    async execute(): Promise<TReturn> {
        this.loading.value = true;

        const result = await this.handler();

        this.loading.value = false;
        return result;
    }

}



export async function useAPI<TReturn>(handler: (api: UseAPITypes.APIClient) => TReturn, disableAuthRedirect = false): UseAPITypes.UseAPIReturnType<TReturn> {

    try {
        if (import.meta.server) {

            const event = useRequestEvent();
            if (!event) {
                return {
                    success: false,
                    code: 500,
                    message: "Failed to retrieve request event on server.",
                    data: null
                } as const;
            }
            const sessionToken = useAppCookies().sessionToken.getServerSide(event);
            updateAPIClient(sessionToken ?? null);
            
            return await handler(baseAPIClient);

        } else if (import.meta.client) {

            const sessionToken = useAppCookies().sessionToken.get();

            if (sessionToken.value) {
                updateAPIClient(sessionToken.value);
            } else {
                updateAPIClient(null);
                if (!disableAuthRedirect) {
                    navigateTo('/auth/login?url=' + encodeURIComponent(useRoute().fullPath));
                }
            }

            const result = await handler(baseAPIClient);

            if ((result as any)?.success === false && (result as any)?.code === 401 && ((result as any)?.message === "Invalid or expired token") || ((result as any)?.message === "Missing or invalid Authorization header")) {
                updateAPIClient(null);
                sessionToken.value = null;
                if (!disableAuthRedirect) {
                    navigateTo('/auth/login?url=' + encodeURIComponent(useRoute().fullPath));
                }
            }
            return result;

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

export async function useAPIAsyncData<TReturn>(name: string, handler: () => Promise<TReturn>) {

    const {
        data,
        pending: loading,
        refresh
    } = await useAsyncData<TReturn>(name, handler);

    return {
        data: data as Ref<TReturn>,
        loading,
        refresh
    } satisfies UseAPITypes.AsyncDataReturn<TReturn>;
}

export async function useAPILazyAsyncData<TReturn>(name: string, handler: () => Promise<TReturn>) {

    const {
        data,
        pending: loading,
        refresh
    } = await useLazyAsyncData<TReturn>(name, handler);

    return {
        data: data as Ref<TReturn>,
        loading,
        refresh
    } satisfies UseAPITypes.LazyAsyncDataReturn<TReturn>;
}

export function useAPIAsyncRequestTask<TReturn>(handler: () => Promise<TReturn>) {
    return new AsyncRequestTaskWrapper<TReturn>(handler) satisfies UseAPITypes.AsyncRequestTaskReturn<TReturn>;
}

