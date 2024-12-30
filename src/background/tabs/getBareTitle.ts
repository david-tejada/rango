import browser, { type Tabs } from "webextension-polyfill";
import {
	sendMessage,
	UnreachableContentScriptError,
} from "../messaging/backgroundMessageBroker";
import { getRequiredCurrentTab } from "./getCurrentTab";

export async function getBareTitle(tabId?: number) {
	try {
		console.log("getTitleBeforeDecoration", tabId);
		return await sendMessage("getTitleBeforeDecoration", undefined, { tabId });
	} catch (error: unknown) {
		if (error instanceof UnreachableContentScriptError) {
			const tab =
				tabId === undefined
					? await getRequiredCurrentTab()
					: await browser.tabs.get(tabId);
			return removeDecorations(tab);
		}

		throw error;
	}
}

async function removeDecorations(tab: Tabs.Tab) {
	const possibleSuffix = ` - ${tab.url}`;
	if (tab.title?.endsWith(possibleSuffix)) {
		tab.title = tab.title.slice(0, -possibleSuffix.length);
	}

	// If document.title is empty, the space after the "|" might have been removed
	// when removing the suffix. That's why it's optional.
	return tab.title?.replace(/^[a-z]{1,2} \| ?/i, "");
}
