import browser from "webextension-polyfill";
import { sendMessage } from "../messaging/backgroundMessageBroker";
import { initStack } from "./hintsAllocator";
import { preloadTabCommitted, preloadTabCompleted } from "./preloadTabs";

async function preloadTabOnCompletedHandler() {
	await preloadTabCompleted();

	browser.webNavigation.onCompleted.removeListener(
		preloadTabOnCompletedHandler
	);
}

export function watchNavigation() {
	browser.webNavigation.onCommitted.addListener(
		async ({ tabId, frameId, url }) => {
			// Frame 0 comes before any of the subframes.
			if (frameId !== 0) return;

			// We could simply check if the tabId is 0 since I don't think Firefox or
			// Chrome use that id, but I think this is safer.
			const isPreloadTab = !(await browser.tabs.get(tabId));

			if (isPreloadTab) {
				await preloadTabCommitted(url);
				const hasOnCompletedListener =
					browser.webNavigation.onCompleted.hasListener(
						preloadTabOnCompletedHandler
					);

				if (!hasOnCompletedListener) {
					browser.webNavigation.onCompleted.addListener(
						preloadTabOnCompletedHandler
					);
				}
			} else {
				browser.webNavigation.onCompleted.removeListener(
					preloadTabOnCompletedHandler
				);
				await initStack(tabId);
			}
		}
	);

	browser.webNavigation.onCompleted.addListener(async ({ tabId, frameId }) => {
		const isPreloadTab = !(await browser.tabs.get(tabId));
		if (isPreloadTab) return;

		await sendMessage("onCompleted", undefined, { tabId, frameId });
	});
}
