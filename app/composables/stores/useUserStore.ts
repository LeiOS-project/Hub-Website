import { ModifiableAbstractStore } from "~/utils/store";
import type { UserInfo } from "~/utils/types";

class UserStore extends ModifiableAbstractStore<UserInfo, Partial<UserInfo>> {

    constructor() {
        super("userInfo", {
            enableAutoFetchIfEmpty: false
        });
    }

    override async update(updates: Partial<UserInfo>) {

        const current = this.useRaw();

        if (!current.value) {
            console.error("Cannot update user info: no user is logged in.");
            return;
        }

        current.value = {
            ...current.value,
            ...updates
        };
    }
    
    protected override async fetchData() {
        try {
            if (!useAppCookies().sessionToken.get().value) {
                return null;
            }
            const response = await useAPI((api) => api.getAccount({}));

            if (!response.success) {
                return null;
            }

            return response.data satisfies UserInfo;

        } catch (error) {
            console.error("Error fetching user info:", error);
            return null;
        }
    }

}


export function useUserStore() {
    return new UserStore();
}
