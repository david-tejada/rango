import { sendMessage } from "../messaging/messageHandler";

let tabId: number | undefined;
let frameId: number | undefined;

export async function loadContentScriptContext() {
	if (tabId !== undefined && frameId !== undefined) return;

	({ tabId, frameId } = await sendMessage("getContentScriptContext"));
}

export function getTabId() {
	if (tabId === undefined) {
		throw new Error(
			"Unable to retrieve tabId. Context script context is not loaded"
		);
	}

	return tabId;
}

/**
 * Returns `true` if this is the current tab; that is, the active tab of the
 * focused window.
 */
export async function isCurrentTab(): Promise<boolean> {
	return sendMessage("isCurrentTab");
}

export function isMainFrame() {
	if (frameId === undefined) {
		throw new Error(
			"Unable to retrieve frameId. Context script context is not loaded"
		);
	}

	return frameId === 0;
}
