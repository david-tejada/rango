import browser from "webextension-polyfill";

let tabId: number;
let frameId: number;

export async function loadContentScriptContext() {
	({ tabId, frameId } = (await browser.runtime.sendMessage({
		type: "getContentScriptContext",
	})) as { tabId: number; frameId: number });
}

export function getTabId() {
	return tabId;
}

export async function isCurrentTab() {
	return (await browser.runtime.sendMessage({
		type: "isCurrentTab",
	})) as boolean;
}

export function isMainframe() {
	return frameId === 0;
}
