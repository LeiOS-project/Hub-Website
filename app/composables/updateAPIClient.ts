import { client } from "@/api-client/client.gen";
import { useRuntimeAppConfigs } from "./useRuntimeAppConfigs";

export function updateAPIClient(token: string | null) {
	const apiURL = useRuntimeAppConfigs().apiUrl;

	client.setConfig({
		baseURL: apiURL,
		// `null` deletes the header; the client's setConfig merges headers, so omitting it
		// would keep sending the previous token (across logout and across SSR requests).
		headers: { Authorization: token ? `Bearer ${token}` : null },
		ignoreResponseError: true,
	});
}
