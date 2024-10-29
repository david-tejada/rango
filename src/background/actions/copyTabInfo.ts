import { type Tabs } from "webextension-polyfill";
import { type RangoActionCopyLocationProperty } from "../../typings/RangoAction";
import { assertDefined } from "../../typings/TypingUtils";
import {
	sendMessage,
	UnreachableContentScriptError,
} from "../messaging/backgroundMessageBroker";
import { getCurrentTab } from "../utils/getCurrentTab";
import { notify } from "../utils/notify";

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

export async function copyLocationProperty(
	tab: Tabs.Tab,
	property: RangoActionCopyLocationProperty["arg"]
) {
	assertDefined(tab.url);

	await notify("Copied to the clipboard", { type: "success" });

	const url = new URL(tab.url);
	const result = url[property];

	return result;
}
