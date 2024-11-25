import browser from "webextension-polyfill";
import { retrieve, store } from "../common/storage";
import { urls } from "../common/urls";
import { getHostPattern } from "../common/utils";
import { toggleKeyboardClicking } from "./actions/toggleKeyboardClicking";
import { addCommandListeners } from "./commands/commandListeners";
import { handleIncomingCommand } from "./commands/handleIncomingCommand";
import { watchNavigation } from "./hints/labels/watchNavigation";
import { toggleHintsGlobal, updateHintsToggle } from "./hints/toggleHints";
import {
	handleIncomingMessage,
	sendMessage,
} from "./messaging/backgroundMessageBroker";
import { addMessageListeners } from "./messaging/messageListeners";
import { initTabMarkers } from "./misc/tabMarkers";
import { setTabLastSounded } from "./tabs/focusTabBySound";
import { trackRecentTabs } from "./tabs/trackRecentTabs";
import { browserAction, setBrowserActionIcon } from "./utils/browserAction";
import { getCurrentTab } from "./utils/getCurrentTab";
import { isSafari } from "./utils/isSafari";
import { notify } from "./utils/notify";

// We need to add the listener right away or else clicking the context menu item
// while the background script/service worker is inactive might fail.
browser.contextMenus.onClicked.addListener(contextMenusOnClicked);

(async () => {
	try {
		addMessageListeners();
		addCommandListeners();
		await trackRecentTabs();
		watchNavigation();
	} catch (error: unknown) {
		console.error(error);
	}
})();

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
			await notify(error.message, { type: "error" });
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
			await notify(error.message, { type: "error" });
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
	// completely (Chrome), either way we need to reset the label stacks
	await store("labelStacks", new Map());
	// This has been renamed to `labelStacks`. Free up space in the storage area.
	await browser.storage.local.remove("hintStacks");

	if (reason === "install") {
		await initTabMarkers();
	}
});

// =============================================================================
// EXTENSION STARTUP
// =============================================================================
browser.runtime.onStartup.addListener(async () => {
	await initTabMarkers();
	await setBrowserActionIcon();
	await store("labelStacks", new Map());
	await store("hintsToggleTabs", new Map());
	await store("tabsByRecency", new Map());
	// In Safari we need to create the menus every time the browser starts.
	if (isSafari()) await createContextMenus();
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
		const tab = await getCurrentTab();
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
}
