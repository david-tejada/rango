import browser from "webextension-polyfill";

let tabId: number;
let frameId: number;

export async function loadContentScriptContext() {
	if (tabId !== undefined && frameId !== undefined) return;

	({ tabId, frameId } = await browser.runtime.sendMessage({
		type: "getContentScriptContext",
	}));
}

export function getTabId() {
	if (tabId === undefined) {
		throw new Error(
			"Unable to retrieve tabId. Context script context is not loaded"
		);
	}

	return tabId;
}

export async function isCurrentTab(): Promise<boolean> {
	return browser.runtime.sendMessage({
		type: "isCurrentTab",
	});
}

export function isMainFrame() {
	if (frameId === undefined) {
		throw new Error(
			"Unable to retrieve frameId. Context script context is not loaded"
		);
	}

	return frameId === 0;
}
