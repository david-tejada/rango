import {
	sendMessage,
	UnreachableContentScriptError,
} from "../messaging/backgroundMessageBroker";
import { getCurrentTab } from "../utils/getCurrentTab";

export async function getBareTitle() {
	try {
		return await sendMessage("getTitleBeforeDecoration");
	} catch (error: unknown) {
		if (error instanceof UnreachableContentScriptError) {
			const tab = await getCurrentTab();
			return tab.title!;
		}

		throw error;
	}
}
