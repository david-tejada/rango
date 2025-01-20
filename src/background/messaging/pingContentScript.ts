import browser from "webextension-polyfill";
import { UnreachableContentScriptError } from "./UnreachableContentScriptError";

export async function pingContentScript(tabId: number) {
	try {
		const contentScriptReached = await browser.tabs.sendMessage(
			tabId,
			{ messageId: "pingContentScript" },
			{ frameId: 0 }
		);

		if (!contentScriptReached) throw new Error("No content script.");
	} catch {
		throw new UnreachableContentScriptError(
			`Unable to communicate with content script for tab with id ${tabId}.`
		);
	}
}
