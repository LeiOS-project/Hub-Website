import { reactive } from "vue";
import type { GetAccountResponses } from "@/api-client/types.gen";

type UserInfo = GetAccountResponses["200"]["data"];

export class UserStore {

    private static readonly userInfo = useAPILazyAsyncRequest("/account", async () => {
        if (!useCookie("session_token").value) {
            return null;
        }
        const response = await useAPI((api) => api.getAccount({}));
        return response.data as UserInfo | null;
    });

    static async use() {
        await this.fetchAndSetIfNeeded();
        return this.userInfo.data satisfies Ref<UserInfo | null>;
    }

    static async fetchAndSetIfNeeded() {
        if (!this.userInfo.data.value?.id) {
            await this.userInfo.fetchData();
        }
    }

    static async refresh() {
        await this.userInfo.fetchData();
    }

    static clear() {
        this.userInfo.data.value = {} as UserInfo;
    }

    static isValid(userInfo: Ref<UserInfo | null>): userInfo is Ref<UserInfo> {
        return !!userInfo.value && !!userInfo.value.id;
    }

}