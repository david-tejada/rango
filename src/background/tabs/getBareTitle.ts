import {
	sendMessage,
	UnreachableContentScriptError,
} from "../messaging/backgroundMessageBroker";
import { getRequiredCurrentTab } from "./getCurrentTab";

export async function getBareTitle() {
	try {
		return await sendMessage("getTitleBeforeDecoration");
	} catch (error: unknown) {
		if (error instanceof UnreachableContentScriptError) {
			const tab = await getRequiredCurrentTab();
			return tab.title!;
		}

		throw error;
	}
}
