import browser from "webextension-polyfill";
import { sendRequestToContent } from "../messaging/sendRequestToContent";
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

		// We also send the frame id in the request as Safari is buggy sending
		// messages to a specific frame and also sends them to other frames. This
		// way we can check in the content script.
		try {
			await sendRequestToContent(
				{ type: "onCompleted", frameId },
				tabId,
				frameId
			);
		} catch (error: unknown) {
			console.error(error);
		}
	});
}
