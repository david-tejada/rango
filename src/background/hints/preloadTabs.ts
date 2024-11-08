// This module, along with watchNavigation, handles preload in Safari. I have
// this part separate to avoid cyclic dependencies since hintsAllocator needs to
// import this module and watchNavigation needs to import hintsAllocator.
//
// The way preload works in Safari is, when the user enters an address or part
// of it in the URL bar, the top hit is preloaded in the tab 0. The onCommitted
// event always happens in the tab 0 but the onCompleted can happen in the tab 0
// or the real tab depending on how fast the user hits enter. For this reason we
// can't trust the tabId information in the navigation event and we always need
// to retrieve the current tab id.
import { getAllFrames } from "../frames/frames";
import { getCurrentTabId } from "../utils/getCurrentTab";

const preloadTabs = new Map<number, { url: string; completed: boolean }>();

// We use the onCommitted event to retrieve the URL since the main frame is
// guarantied to come before the rest.
export async function preloadTabCommitted(url: string) {
	const currentTabId = await getCurrentTabId();
	preloadTabs.set(currentTabId, { url, completed: false });
}

export async function preloadTabCompleted() {
	const currentTabId = await getCurrentTabId();
	const preloadTab = preloadTabs.get(currentTabId)!;
	preloadTab.completed = true;
}

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
