import browser from "webextension-polyfill";
import { initStorage, retrieve, store } from "../../common/storage";
import { urls } from "../../common/urls";
import { watchNavigation } from "../hints/watchNavigation";
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

	// This is not necessary in production. It's only here to prevent flaky tests.
	if (reason === "install" && process.env["NODE_ENV"] !== "production") {
		await initStorage();
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
