import browser from "webextension-polyfill";

let tabId: number;
let frameId: number;

export async function loadContentScriptContext() {
	if (tabId !== undefined && frameId !== undefined) return;

	({ tabId, frameId } = (await browser.runtime.sendMessage({
		type: "getContentScriptContext",
	})) as { tabId: number; frameId: number });
}

export function getTabId() {
	if (tabId === undefined) {
		throw new Error(
			"Unable to retrieve tabId. Context script context is not loaded"
		);
	}

	return tabId;
}

export async function isCurrentTab() {
	return (await browser.runtime.sendMessage({
		type: "isCurrentTab",
	})) as boolean;
}

export function isMainframe() {
	if (frameId === undefined) {
		throw new Error(
			"Unable to retrieve frameId. Context script context is not loaded"
		);
	}

	return frameId === 0;
}

export async function getFrameId() {
	if (!frameId) {
		await loadContentScriptContext();
	}

	return frameId;
}
