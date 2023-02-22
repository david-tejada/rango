import browser from "webextension-polyfill";
import { ContentRequest } from "../../typings/ContentRequest";

export async function sendRequestToAllTabs(request: ContentRequest) {
	// We first send the command to the active tabs and then to the rest where it will be
	// executed using window.requestIdleCallback.
	const activeTabs = await browser.tabs.query({
		active: true,
	});

	// We use allSettled here because we want to finish with the active tabs before
	// we move on with the non-active tabs
	await Promise.allSettled(
		activeTabs.map(async (tab) => {
			if (tab.id) {
				return browser.tabs.sendMessage(tab.id, request);
			}
		})
	);

	const nonActiveTabs = await browser.tabs.query({
		active: false,
	});

	const backgroundTabRequest = { ...request };
	backgroundTabRequest.type += "OnIdle";
	await Promise.allSettled(
		nonActiveTabs.map(async (tab) => {
			if (tab.id) {
				return browser.tabs.sendMessage(tab.id, backgroundTabRequest);
			}
		})
	);
}
