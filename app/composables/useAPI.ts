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

    export type LazyRequestReturn<TReturn> = LazyRequestWrapper<TReturn>;

    export type LazyAsyncDataRequestReturn<TReturn> = LazyAsyncDataRequestWrapper<TReturn>;

    // export type UnionReturn<TReturn> = DefaultReturn<TReturn> | LazyRequestReturn<TReturn> | AsyncDataReturn<TReturn> | LazyAsyncDataReturn<TReturn> | LazyAsyncDataRequestReturn<TReturn>;

    // export type UseAPIModes = "normal" | "lazyRequest" | "asyncData" | "lazyAsyncData" | "lazyAsyncDataRequest";

}

class LazyRequestWrapper<TReturn> {

    readonly loading = ref(false);

    constructor(
        protected readonly handler: () => Promise<TReturn>
    ) { }

    async execute(): Promise<TReturn> {
        this.loading.value = true;

        const result = await this.handler();

        this.loading.value = false;
        return result;
    }

}

class LazyAsyncDataRequestWrapper<TReturn> {

    readonly data: Ref<TReturn | null> = ref(null);
    readonly loading: Ref<boolean> = ref(false);

    protected refreshFunction?: () => Promise<void>;

    constructor(
        protected readonly name: string,
        protected readonly handler: () => Promise<TReturn>,
        immediateFNInit: boolean
    ) {
        if (immediateFNInit) {
            this.init();
        }
    }

    public init() {

        const { data, refresh, pending } = useLazyAsyncData<TReturn>(this.name, this.handler, {
            immediate: false
        });

        watch(data, (newData) => {
            this.data.value = newData as TReturn | undefined || null;
        }, { immediate: true });
        
        watch(pending, (newPending) => {
            this.loading.value = newPending;
        }, { immediate: true });

        this.refreshFunction = refresh;
    }

    async fetchData() {

        if (!this.refreshFunction) {
            this.init();
        }
        if (!this.refreshFunction) {
            throw new Error("Failed to initialize refresh function.");
        }
        await this.refreshFunction();
        
        return this.data;
    }
}

// async function createAPIClient(handle: (original: Function, args: unknown[]) => Promise<any>) {
//     return new Proxy({}, {
//         get(_, prop: keyof APIClient) {
//             const original = (baseAPIClient as APIClient)[prop] as Function;
//             if (typeof original !== 'function') {
//                 return original;
//             }
//             return async (...args: unknown[]) => {
//                 try {
//                     return await handle(original, args);
//                 } catch (error) {
//                     return {
//                         success: false,
//                         code: 500,
//                         message: (error as Error).message ?? "An unknown error occurred.",
//                         data: null
//                     } as const;
//                 }
//             }
//         }
//     }) as APIClient;
// }

// async function createRuntimeAPIClient(
//   disableAuthRedirect: boolean
// ): Promise<APIClient> {
//     let apiClient: APIClient;

//     if (import.meta.server) {
//         apiClient = await createAPIClient(async (original, args) => {

//             const { data } = await useAsyncData(async (nuxtApp) => {

//                 const sessionToken = useCookie("leioshub_session_token");

//                 sessionToken.value ? updateAPIClient(sessionToken.value) : updateAPIClient(null);

//                 return await original.apply(null, args);
//             });

//             return data.value ?? {
//                 success: false,
//                 code: 500,
//                 message: "Failed to process API request on server.",
//                 data: null
//             } as const;
//         });

//     } else if (import.meta.client) {

//         apiClient = await createAPIClient(async (original, args) => {

//             const sessionToken = useCookie("leioshub_session_token");

//             if (sessionToken.value) {
//                 updateAPIClient(sessionToken.value);
//             } else {
//                 updateAPIClient(null);
//                 if (!disableAuthRedirect) {
//                     navigateTo('/auth/login?url=' + encodeURIComponent(useRoute().fullPath));
//                 }
//             }

//             return await (original as Function).apply(null, args);
//         });
//     } else {
//         apiClient = await createAPIClient(async (original, args) => {
//             return {
//                 success: false,
//                 code: 500,
//                 message: "API requests cannot be made in this environment.",
//                 data: null
//             } as const;
//         });
//     }

//     return apiClient;
// }

// export async function useAPI<TReturn>(handler: (api: APIClient) => Promise<TReturn> | TReturn, mode?: "normal", disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.NormalReturn<TReturn>>;
// export async function useAPI<TReturn>(handler: (api: APIClient) => Promise<TReturn> | TReturn, mode: "lazyRequest", disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.LazyRequestReturn<TReturn>>;
// export async function useAPI<TReturn>(handler: (api: APIClient) => Promise<TReturn> | TReturn, mode: "asyncData", disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.AsyncDataReturn<TReturn>>;
// export async function useAPI<TReturn>(handler: (api: APIClient) => Promise<TReturn> | TReturn, mode: "lazyAsyncData", disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.LazyAsyncDataReturn<TReturn>>;
// export async function useAPI<TReturn>(handler: (api: APIClient) => Promise<TReturn> | TReturn, mode: "lazyAsyncDataRequest", disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.LazyAsyncDataRequestReturn<TReturn>>;
// export async function useAPI<TReturn>(handler: (api: APIClient) => Promise<TReturn> | TReturn, mode: string, disableAuthRedirect?: boolean): Promise<UseAPIReturnTypes.UnionReturn<TReturn>>;
// export async function useAPI<TReturn>(handler: (api: APIClient) => Promise<TReturn> | TReturn, mode: string = "normal", disableAuthRedirect = false): Promise<UseAPIReturnTypes.UnionReturn<TReturn>> {

//     switch (mode as UseAPIModes) {
//         case "normal": {
//             // continues to the main implementation
//             break;
//         }
//         case "lazyRequest": {
//             return new LazyRequestWrapper(handler, disableAuthRedirect);
//         }
//         case "asyncData": {

//             const { data, pending: loading, refresh } = await useAsyncData(async () => {
//                 return await useAPI(handler, "normal", disableAuthRedirect);
//             });

//             return { data, loading, refresh } as UseAPIReturnTypes.AsyncDataReturn<TReturn>;
//         }
//         case "lazyAsyncData": {

//             const { data, pending: loading, refresh } = await useLazyAsyncData(async () => {
//                 return await useAPI(handler, "normal", disableAuthRedirect);
//             });

//             return { data, loading, refresh } as UseAPIReturnTypes.LazyAsyncDataReturn<TReturn>;
//         }
//         case "lazyAsyncDataRequest": {
//             return new LazyAsyncDataRequestWrapper(handler, disableAuthRedirect);
//         }
//     }

//     const apiClient = await createRuntimeAPIClient(disableAuthRedirect);
//     return handler(apiClient);
// }


export async function useAPI<TReturn>(handler: (api: UseAPITypes.APIClient) => TReturn, disableAuthRedirect = false): UseAPITypes.UseAPIReturnType<TReturn> {

    try {
        if (import.meta.server) {

            /*
            const { data } = await useAsyncData(async (nuxtApp) => {

                const sessionToken = useCookie("leioshub_session_token");

                sessionToken.value ? updateAPIClient(sessionToken.value) : updateAPIClient(null);

                return handler(baseAPIClient);
            });

            return data.value as TReturn ?? {
                success: false,
                code: 500,
                message: "Failed to process API request on server.",
                data: null
            } as const
            */

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

            const sessionToken = useCookie("leioshub_session_token");

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

    const { data, pending: loading, refresh } = await useAsyncData<TReturn>(name, handler);

    return { data, loading, refresh } as {
        data: Ref<TReturn>;
        loading: Ref<boolean>;
        refresh: () => Promise<void>;
    } satisfies UseAPITypes.AsyncDataReturn<TReturn>;
}

export async function useAPILazyAsyncData<TReturn>(name: string, handler: () => Promise<TReturn>) {

    const { data, pending: loading, refresh } = await useLazyAsyncData<TReturn>(name, handler);

    return { data, loading, refresh } as {
        data: Ref<TReturn>;
        loading: Ref<boolean>;
        refresh: () => Promise<void>;
    } satisfies UseAPITypes.LazyAsyncDataReturn<TReturn>;
}

export function useAPILazyRequest<TReturn>(handler: () => Promise<TReturn>) {
    return new LazyRequestWrapper<TReturn>(handler) satisfies UseAPITypes.LazyRequestReturn<TReturn>;
}

export function useAPILazyAsyncRequest<TReturn>(name: string, handler: () => Promise<TReturn>, immediateFNInit = false) {
    return new LazyAsyncDataRequestWrapper<TReturn>(name, handler, immediateFNInit) satisfies UseAPITypes.LazyAsyncDataRequestReturn<TReturn>;
}