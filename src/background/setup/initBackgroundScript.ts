/* eslint-disable no-await-in-loop */
import browser from "webextension-polyfill";
import { Settings, defaultSettings } from "../../common/settings";
import {
	retrieve,
	storageHas,
	store,
	storeIfUndefined,
} from "../../common/storage";
import { urls } from "../../common/urls";
import { watchNavigation } from "../hints/watchNavigation";
import { resetTabMarkers } from "../misc/tabMarkers";
import { trackRecentTabs } from "./trackRecentTabs";

/**
 * We only need this function temporarily while the users go from a version
 * below 0.3.5 to a version equal or above it. To be removed in the future.
 */
async function switchToSyncStorage() {
	let key: keyof Settings;

	for (key in defaultSettings) {
		if (Object.prototype.hasOwnProperty.call(defaultSettings, key)) {
			const hasLocal = await storageHas(key, false);
			if (hasLocal) {
				const value = await retrieve(key, false);
				await store(key, value);
			}
		}
	}

	const hintsToggle = await retrieve("hintsToggle");

	if (hintsToggle) {
		const hintsToggleGlobal = hintsToggle.global;
		const hintsToggleHosts = new Map(hintsToggle.hosts);
		const hintsTogglePaths = new Map(hintsToggle.paths);
		const hintsToggleTabs = new Map(hintsToggle.tabs);

		await store("hintsToggleGlobal", hintsToggleGlobal);
		await store("hintsToggleHosts", hintsToggleHosts);
		await store("hintsTogglePaths", hintsTogglePaths);
		await store("hintsToggleTabs", hintsToggleTabs);
	}

	await store("switchedToSyncStorage", true);
}

async function resetHintsStacks() {
	await store("hintsStacks", new Map());
}

export async function initBackgroundScript() {
	browser.runtime.onInstalled.addListener(
		async ({ reason, previousVersion }) => {
			if (reason !== "install" && reason !== "update") return;

			const switchedToSyncStorage = await retrieve("switchedToSyncStorage");
			if (!switchedToSyncStorage) await switchToSyncStorage();

			let key: keyof typeof defaultSettings;
			const storing: Array<Promise<void>> = [];

			for (key in defaultSettings) {
				if (Object.prototype.hasOwnProperty.call(defaultSettings, key)) {
					storing.push(storeIfUndefined(key, defaultSettings[key]));
				}
			}

			await Promise.all(storing);

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

			await storeIfUndefined("hintsToggleTabs", new Map());
			await storeIfUndefined("tabsByRecency", {});

			// If this is an update the content scrips either reload (Firefox) or stop
			// completely (Chrome), either way we need to reset the hints stacks
			await resetHintsStacks();

			if (reason === "install") {
				await resetTabMarkers();
				await trackRecentTabs();
			}
		}
	);

	browser.runtime.onStartup.addListener(async () => {
		await resetTabMarkers();
		await resetHintsStacks();

		const keyboardClicking = await retrieve("keyboardClicking");
		if (keyboardClicking) {
			await (browser.action
				? browser.action.setIcon({ path: urls.iconKeyboard48.pathname })
				: browser.browserAction.setIcon({
						path: urls.iconKeyboard48.pathname,
				  }));
		}

		await store("hintsToggleTabs", new Map());
		await store("tabsByRecency", {});
		await trackRecentTabs();
	});

	// This is to track recent tabs when the background script/service worker is
	// restarted. First we need to make sure tabsByRecency has already been
	// initialized either onInstalled or onStartup.
	const tabsByRecency = await retrieve("tabsByRecency");
	if (tabsByRecency) {
		await trackRecentTabs();
	}

	watchNavigation();
}
