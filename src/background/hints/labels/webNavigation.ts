import browser from "webextension-polyfill";
import {
	UnreachableContentScriptError,
	sendMessage,
} from "../../messaging/backgroundMessageBroker";
import { getRequiredCurrentTabId } from "../../tabs/getCurrentTab";
import { getAllFrames } from "../../utils/getAllFrames";
import { initStack } from "./labelStack";

async function preloadTabOnCompletedHandler() {
	await preloadTabCompleted();

	browser.webNavigation.onCompleted.removeListener(
		preloadTabOnCompletedHandler
	);
}

/**
 * Adds the listeners for the webNavigation `onCommitted` and `onCompleted`
 * events so that we can initialize label stacks when necessary.
 */
export function addWebNavigationListeners() {
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

// =============================================================================
// PRELOAD TABS
// =============================================================================

// The way preload works in Safari is, when the user enters an address or part
// of it in the URL bar, the top hit is preloaded in the tab 0. The onCommitted
// event always happens in the tab 0 but the onCompleted can happen in the tab 0
// or the real tab depending on how fast the user hits enter. For this reason we
// can't trust the tabId information in the navigation event and we always need
// to retrieve the current tab id.

const preloadTabs = new Map<number, { url: string; completed: boolean }>();

export async function navigationOccurred(tabId: number) {
	const preloadTabDetails = preloadTabs.get(tabId);

	if (!preloadTabDetails?.completed) return false;

	// I should be using browser.webNavigation.getFrame here but for whatever
	// reason it's not working in Safari, although it is supposed to be supported.
	const allFrames = await getAllFrames(tabId);
	const currentMainFrame = allFrames.find((frame) => frame.frameId === 0);

	// We need to check that the current URL and the URL of the navigation event
	// are the same. This is to handle the user inserting an address that triggers
	// preload but not actually navigating to the page (hitting escape, for
	// example).
	const result = currentMainFrame
		? preloadTabDetails.url === currentMainFrame.url
		: false;

	preloadTabs.delete(tabId);

	return result;
}

// We use the onCommitted event to retrieve the URL since the main frame is
// guarantied to come before the rest.
async function preloadTabCommitted(url: string) {
	const currentTabId = await getRequiredCurrentTabId();
	preloadTabs.set(currentTabId, { url, completed: false });
}

async function preloadTabCompleted() {
	const currentTabId = await getRequiredCurrentTabId();
	const preloadTab = preloadTabs.get(currentTabId)!;
	preloadTab.completed = true;
}
