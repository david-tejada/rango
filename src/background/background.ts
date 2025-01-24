import browser from "webextension-polyfill";
import { getHostPattern } from "../common/getHostPattern";
import { retrieve, store } from "../common/storage/storage";
import { urls } from "../common/urls";
import { addCommandListeners } from "./commands/commandListeners";
import { handleIncomingCommand } from "./commands/handleIncomingCommand";
import { addWebNavigationListeners } from "./hints/labels/webNavigation";
import { toggleHintsGlobal, updateHintsToggle } from "./hints/toggleHints";
import { handleIncomingMessage } from "./messaging/messageHandler";
import { addMessageListeners } from "./messaging/messageListeners";
import { sendMessage, sendMessageSafe } from "./messaging/sendMessage";
import { UnreachableContentScriptError } from "./messaging/UnreachableContentScriptError";
import { toggleKeyboardClicking } from "./settings/keyboardClicking";
import { trackRecentTabs } from "./tabs/focusPreviousTab";
import { setTabLastSounded } from "./tabs/focusTabBySound";
import { getCurrentTab, getRequiredCurrentTab } from "./tabs/getCurrentTab";
import {
	addTabMarkerListeners,
	initializeAndReconcileTabMarkers,
} from "./tabs/tabMarkers";
import { browserAction, setBrowserActionIcon } from "./utils/browserAction";
import { isSafari } from "./utils/isSafari";
import { notify } from "./utils/notify";

// We need to add the listener right away or else clicking the context menu item
// while the background script/service worker is inactive might fail.
browser.contextMenus.onClicked.addListener(contextMenusOnClicked);

// Critical listeners. They need to be added as soon as possible.
// https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/events
try {
	addTabMarkerListeners();
	trackRecentTabs();
	addWebNavigationListeners();
	addMessageListeners();
	addCommandListeners();
} catch (error: unknown) {
	console.error(error);
}

// =============================================================================
// TEST COMMAND HANDLING
// =============================================================================
if (process.env["NODE_ENV"] === "test") {
	addEventListener("handle-test-request", handleIncomingCommand);
}

// =============================================================================
// MESSAGE HANDLING
// =============================================================================
browser.runtime.onMessage.addListener(async (message, sender) =>
	handleIncomingMessage(message, sender)
);

// =============================================================================
// BROWSER ACTION
// =============================================================================
browserAction.onClicked.addListener(async () => {
	try {
		await toggleHintsGlobal();
	} catch (error: unknown) {
		console.error(error);
		if (error instanceof Error) {
			await notify.error(error.message);
		}
	}
});

// =============================================================================
// INTERNAL COMMAND HANDLING
// =============================================================================
browser.commands.onCommand.addListener(async (internalCommand: string) => {
	try {
		if (
			internalCommand === "get-talon-request" ||
			internalCommand === "get-talon-request-alternative"
		) {
			await handleIncomingCommand();
		}

		if (internalCommand === "toggle-hints") {
			await toggleHintsGlobal();
		}

		if (internalCommand === "disable-hints") {
			await updateHintsToggle("global", false);
		}

		if (internalCommand === "enable-hints") {
			await updateHintsToggle("global", true);
		}

		if (internalCommand === "toggle-keyboard-clicking") {
			await toggleKeyboardClicking();
		}
	} catch (error: unknown) {
		console.error(error);
		if (error instanceof Error) {
			await notify.error(error.message);
		}
	}
});

// =============================================================================
// EXTENSION INSTALL AND UPDATE
// =============================================================================
browser.runtime.onInstalled.addListener(async ({ reason, previousVersion }) => {
	if (reason !== "install" && reason !== "update") return;

	await setBrowserActionIcon();
	await createContextMenus();

	if (reason === "install" && process.env["NODE_ENV"] === "production") {
		await browser.tabs.create({ url: urls.onboarding.href });
	}

	if (reason === "update" && process.env["NODE_ENV"] === "production") {
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

		if (currentMajor > previousMajor || currentMinor > previousMinor) {
			await store("showWhatsNewPageNextStartup", true);
			await notify.info(
				`Rango has been updated to version ${currentVersion}. Click "What's New" in the context menu to see the changes.`
			);
		}
	}

	// If this is an update the content scrips either reload (Firefox) or stop
	// completely (Chrome), either way we need to reset the local storage
	await browser.storage.local.clear();

	await initializeAndReconcileTabMarkers();
});

// =============================================================================
// EXTENSION STARTUP
// =============================================================================
browser.runtime.onStartup.addListener(async () => {
	await browser.storage.local.clear();
	await initializeAndReconcileTabMarkers();
	await setBrowserActionIcon();
	await store("hintsToggleTabs", new Map());
	// In Safari we need to create the menus every time the browser starts.
	if (isSafari()) await createContextMenus();

	const showWhatsNewPageOnUpdate = await retrieve("showWhatsNewPageOnUpdate");
	const showWhatsNewPageNextStartup = await retrieve(
		"showWhatsNewPageNextStartup"
	);

	if (showWhatsNewPageOnUpdate && showWhatsNewPageNextStartup) {
		await browser.tabs.create({ url: urls.whatsNewPage.href });
		// The flag is cleared after the What's New page loads but we also clear it
		// here to be extra safe.
		await store("showWhatsNewPageNextStartup", false);
	}
});

// =============================================================================
// BOOKMARK TITLE RESET
// =============================================================================

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

/**
 * Strip the tab marker and url added by Rango from the title of the bookmark.
 */
async function resetBookmarkTitle(
	id: string,
	changeInfo: browser.Bookmarks.OnChangedChangeInfoType
) {
	try {
		// The user might be bookmarking multiple tabs, so we need to find the tab
		// that matches the bookmark.
		const matchingTabs = await browser.tabs.query({
			url: changeInfo.url,
			title: changeInfo.title,
		});
		const tabForBookmark = matchingTabs[0];

		// Here we make sure that the bookmark event was triggered because the
		// user saved a bookmark. We don't want to modify the title if the user was
		// changing it manually.
		if (!tabForBookmark || tabForBookmark.title !== changeInfo.title) {
			return;
		}

		const titleBeforeDecorations = await sendMessage(
			"getTitleBeforeDecoration",
			undefined,
			{ tabId: tabForBookmark.id }
		);

		if (titleBeforeDecorations) {
			// We remove the event listener temporarily so it doesn't trigger when we
			// update the title.
			browser.bookmarks?.onChanged.removeListener(resetBookmarkTitle);
			await browser.bookmarks.update(id, { title: titleBeforeDecorations });
			browser.bookmarks?.onChanged.addListener(resetBookmarkTitle);
		}
	} catch (error: unknown) {
		// If we get an `UnreachableContentScriptError` we don't need to do
		// anything. The user might be adding a bookmark to a page where the content
		// script can't run. In that case decorations wouldn't have been added to
		// the title. We log all other errors to the console.
		if (!(error instanceof UnreachableContentScriptError)) {
			console.error(error);
		}
	}
}

// =============================================================================
// CONTEXT MENUS
// =============================================================================
async function createContextMenus() {
	const keyboardClicking = await retrieve("keyboardClicking");

	const contexts: browser.Menus.ContextType[] = browser.browserAction
		? ["browser_action"]
		: ["action"];

	browser.contextMenus.create({
		id: "keyboard-clicking",
		title: "Keyboard Clicking",
		type: "checkbox",
		contexts,
		checked: keyboardClicking,
	});

	browser.contextMenus.create({
		id: "settings",
		title: "Settings",
		type: "normal",
		contexts,
	});

	browser.contextMenus.create({
		id: "help",
		title: "Help",
		type: "normal",
		contexts,
	});

	browser.contextMenus.create({
		id: "add-keys-to-exclude",
		title: "Add Keys to Exclude",
		type: "normal",
		contexts,
	});

	browser.contextMenus.create({
		id: "whats-new",
		title: "What's New",
		type: "normal",
		contexts,
	});
}

async function contextMenusOnClicked({
	menuItemId,
}: browser.Menus.OnClickData) {
	if (menuItemId === "keyboard-clicking") {
		await toggleKeyboardClicking();
	}

	if (menuItemId === "settings") {
		await browser.runtime.openOptionsPage();
	}

	if (menuItemId === "help") {
		await browser.tabs.create({
			url: "https://rango.click",
		});
	}

	if (menuItemId === "add-keys-to-exclude") {
		const keysToExclude = await retrieve("keysToExclude");
		const tab = await getRequiredCurrentTab();
		const hostPattern = tab.url && getHostPattern(tab.url);
		const keysToExcludeForHost = keysToExclude.find(
			([pattern]) => pattern === hostPattern
		);

		if (!keysToExcludeForHost && hostPattern) {
			keysToExclude.push([hostPattern, ""]);
			await store("keysToExclude", keysToExclude);
		}

		await browser.runtime.openOptionsPage();
	}

	if (menuItemId === "whats-new") {
		await browser.tabs.create({ url: urls.whatsNewPage.href });
	}
}

// =============================================================================
// TAB UPDATED
// =============================================================================
browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
	const { title, url } = changeInfo;
	if (title ?? url) {
		await sendMessageSafe("tabDidUpdate", { title, url }, { tabId });
	}
});

let lastCurrentTab: browser.Tabs.Tab | undefined;

(async () => {
	try {
		lastCurrentTab = await getCurrentTab();
	} catch (error: unknown) {
		console.error(error);
	}
})();

browser.tabs.onActivated.addListener(async (activeInfo) => {
	try {
		const { tabId, windowId } = activeInfo;

		// If the window also changes the update will be handled by the
		// `windows.onFocusChanged` listener.
		if (windowId !== lastCurrentTab?.windowId) return;

		await sendMessageSafe("currentTabChanged", undefined, {
			tabId: lastCurrentTab.id,
		});

		await sendMessageSafe("currentTabChanged", undefined, { tabId });

		lastCurrentTab = await browser.tabs.get(tabId);
	} catch (error: unknown) {
		console.error(error);
	}
});

browser.windows.onFocusChanged.addListener(async (windowId) => {
	try {
		// The window might not be valid. For example, if it's a devtools window.
		if (!(await isValidWindow(windowId))) return;

		if (lastCurrentTab) {
			await sendMessageSafe("currentTabChanged", undefined, {
				tabId: lastCurrentTab.id,
			});
		}

		lastCurrentTab = await getRequiredCurrentTab();
		await sendMessageSafe("currentTabChanged", undefined, {
			tabId: lastCurrentTab.id,
		});
	} catch (error: unknown) {
		console.error(error);
	}
});

async function isValidWindow(windowId: number) {
	try {
		await browser.windows.get(windowId);
		return true;
	} catch {
		return false;
	}
}
