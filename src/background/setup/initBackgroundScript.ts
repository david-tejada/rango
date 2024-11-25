import browser from "webextension-polyfill";
import { retrieve, store } from "../../common/storage";
import { urls } from "../../common/urls";
import { watchNavigation } from "../hints/watchNavigation";
import { sendMessage } from "../messaging/backgroundMessageBroker";
import { addMessageListeners } from "../messaging/messageListeners";
import { createContextMenus } from "../misc/createContextMenus";
import { initTabMarkers } from "../misc/tabMarkers";
import { setTabLastSounded } from "../tabs/focusTabBySound";
import { setBrowserActionIcon } from "../utils/browserAction";
import { getCurrentTab } from "../utils/getCurrentTab";
import { isSafari } from "../utils/isSafari";
import { addCommandListeners } from "./commandListeners";
import { trackRecentTabs } from "./trackRecentTabs";

export async function initBackgroundScript() {
	addMessageListeners();
	addCommandListeners();
	await trackRecentTabs();
	watchNavigation();
}

browser.runtime.onInstalled.addListener(async ({ reason, previousVersion }) => {
	if (reason !== "install" && reason !== "update") return;

	await setBrowserActionIcon();
	await createContextMenus();

	if (reason === "install" && process.env["NODE_ENV"] === "production") {
		await browser.tabs.create({ url: urls.onboarding.href });
	}

	if (
		reason === "update" &&
		(await retrieve("showWhatsNewPageOnUpdate")) &&
		process.env["NODE_ENV"] === "production"
	) {
		const currentVersion = browser.runtime.getManifest().version;
		const [currentMajor, currentMinor] = currentVersion.split(".") as [
			string,
			string,
			string,
		];
		const [previousMajor, previousMinor] = previousVersion!.split(".") as [
			string,
			string,
			string,
		];

		if (currentMajor !== previousMajor || currentMinor !== previousMinor) {
			await browser.tabs.create({ url: urls.whatsNewPage.href });
		}
	}

	// If this is an update the content scrips either reload (Firefox) or stop
	// completely (Chrome), either way we need to reset the hint stacks
	await store("labelStacks", new Map());
	// This has been renamed to `labelStacks`. Free up space in the storage area.
	await browser.storage.local.remove("hintStacks");

	if (reason === "install") {
		await initTabMarkers();
	}
});

browser.runtime.onStartup.addListener(async () => {
	await initTabMarkers();
	await setBrowserActionIcon();
	await store("labelStacks", new Map());
	await store("hintsToggleTabs", new Map());
	await store("tabsByRecency", new Map());
	// In Safari we need to create the menus every time the browser starts.
	if (isSafari()) await createContextMenus();
});

/**
 * Strip the tab marker and url added by Rango from the title of the bookmark.
 */
async function resetBookmarkTitle(
	id: string,
	changeInfo: browser.Bookmarks.OnChangedChangeInfoType
) {
	const includeTabMarkers = await retrieve("includeTabMarkers");
	const urlInTitle = await retrieve("urlInTitle");

	const currentTab = await getCurrentTab();
	const { title: bookmarkTitle, url: bookmarkUrl } = changeInfo;

	if (
		!bookmarkUrl ||
		currentTab.url !== bookmarkUrl ||
		currentTab.title !== bookmarkTitle
	) {
		return;
	}

	if (includeTabMarkers || urlInTitle) {
		try {
			const titleBeforeDecorations = await sendMessage(
				"getTitleBeforeDecoration"
			);

			if (titleBeforeDecorations) {
				// We remove the event listener temporarily so it doesn't trigger when
				// we update the title.
				browser.bookmarks?.onChanged.removeListener(resetBookmarkTitle);
				await browser.bookmarks.update(id, { title: titleBeforeDecorations });
				browser.bookmarks?.onChanged.addListener(resetBookmarkTitle);
			}
		} catch {
			// Do nothing. The user might be adding a bookmark to a page where the
			// content script can't run. In that case the title wouldn't have been
			// changed.
		}
	}
}

// We use optional chaining because this isn't supported in Safari.
browser.bookmarks?.onCreated.addListener(resetBookmarkTitle);

// We need to add a listener to onChanged here because of the way bookmarks are
// saved in Chrome. When the bookmark popup appears the bookmark is saved. We
// change the title after onCreated is triggered, but when the user hits "done"
// the title of the bookmark will be changed again to the value of the input
// field of the popup window.
browser.bookmarks?.onChanged.addListener(resetBookmarkTitle);

browser.tabs.onUpdated.addListener(async (tabId, { audible }) => {
	if (audible === true) {
		const tab = await browser.tabs.get(tabId);
		if (!tab.mutedInfo?.muted) setTabLastSounded(tabId);
	}
});
