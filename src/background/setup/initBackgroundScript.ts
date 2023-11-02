import browser from "webextension-polyfill";
import { retrieve, store } from "../../common/storage";
import { urls } from "../../common/urls";
import { watchNavigation } from "../hints/watchNavigation";
import { sendRequestToContent } from "../messaging/sendRequestToContent";
import { createContextMenus } from "../misc/createContextMenus";
import { initTabMarkers } from "../misc/tabMarkers";
import { setBrowserActionIcon } from "../utils/browserAction";
import { isSafari } from "../utils/isSafari";
import { trackRecentTabs } from "./trackRecentTabs";

export async function initBackgroundScript() {
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
			string
		];
		const [previousMajor, previousMinor] = previousVersion!.split(".") as [
			string,
			string,
			string
		];

		if (currentMajor !== previousMajor || currentMinor !== previousMinor) {
			await browser.tabs.create({ url: urls.whatsNewPage.href });
		}
	}

	// If this is an update the content scrips either reload (Firefox) or stop
	// completely (Chrome), either way we need to reset the hints stacks
	await store("hintsStacks", new Map());

	if (reason === "install") {
		await initTabMarkers();
	}
});

browser.runtime.onStartup.addListener(async () => {
	await initTabMarkers();
	await setBrowserActionIcon();
	await store("hintsStacks", new Map());
	await store("hintsToggleTabs", new Map());
	await store("tabsByRecency", new Map());
	// In Safari we need to create the menus every time the browser starts.
	if (isSafari()) await createContextMenus();
});

/**
 * Strip the tab marker and url added by Rango from the title of the bookmark.
 */
async function resetBookmarkTitle(id: string) {
	const includeTabMarkers = await retrieve("includeTabMarkers");
	const urlInTitle = await retrieve("urlInTitle");

	if (includeTabMarkers || urlInTitle) {
		try {
			const titleBeforeDecorations = (await sendRequestToContent({
				type: "getTitleBeforeDecoration",
			})) as string | undefined;

			if (titleBeforeDecorations) {
				// We remove the event listener temporarily so it doesn't trigger when
				// we update the title.
				browser.bookmarks?.onChanged.removeListener(resetBookmarkTitle);
				await browser.bookmarks.update(id, { title: titleBeforeDecorations });
				browser.bookmarks?.onChanged.addListener(resetBookmarkTitle);
			}
		} catch {
			// Do nothing. The user might be modifying the bookmark manually. In that
			// case sendRequestToContent would fail.
		}
	}
}

// We use optional chaining because this isn't supported in Safari.
browser.bookmarks?.onCreated.addListener(resetBookmarkTitle);

// In Chrome the bookmark is created when we open the dialog and updated when we
// submit.
browser.bookmarks?.onChanged.addListener(resetBookmarkTitle);
