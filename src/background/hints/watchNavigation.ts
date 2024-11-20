import browser from "webextension-polyfill";
import {
	UnreachableContentScriptError,
	sendMessage,
} from "../messaging/backgroundMessageBroker";
import { initStack } from "./labelAllocator";
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

		try {
			await sendMessage("onCompleted", undefined, { tabId, frameId });
		} catch (error: unknown) {
			// At this point the content script might not have yet loaded. This is ok
			// and expected. This command is only used for synchronizing hints when
			// navigating back and forward in history and the content script being
			// restored.
			if (!(error instanceof UnreachableContentScriptError)) {
				throw error;
			}
		}
	});
}
