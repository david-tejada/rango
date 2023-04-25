/* eslint-disable no-await-in-loop */
import browser from "webextension-polyfill";
import {
	retrieve,
	storageHas,
	store,
	storeIfUndefined,
} from "../../common/storage";
import { Settings, defaultSettings } from "../../common/settings";
import { urls } from "../../common/urls";
import { watchNavigation } from "../hints/watchNavigation";
import { trackRecentTabs } from "./trackRecentTabs";

// We only need this function temporarily while the users go from a version
// below 0.3.5 to a version equal or above it. To be removed in the future.
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

async function clearUnusedStacks() {
	const tabs = await browser.tabs.query({});
	const tabIds = new Set(tabs.map((tab) => tab.id));
	const stacksAvailable = await storageHas("hintsStacks");
	const stacks = stacksAvailable ? await retrieve("hintsStacks") : new Map();

	for (const [tabId] of stacks) {
		if (!tabIds.has(tabId)) {
			stacks.delete(tabId);
		}
	}

	await store("hintsStacks", stacks);
}

export async function initBackgroundScript() {
	const switchedToSyncStorage = await retrieve("switchedToSyncStorage");
	if (!switchedToSyncStorage) await switchToSyncStorage();

	await clearUnusedStacks();

	let key: keyof typeof defaultSettings;
	const storing: Array<Promise<void>> = [];

	for (key in defaultSettings) {
		if (Object.prototype.hasOwnProperty.call(defaultSettings, key)) {
			storing.push(storeIfUndefined(key, defaultSettings[key]));
		}
	}

	await Promise.all(storing);

	const keyboardClicking = await retrieve("keyboardClicking");
	if (keyboardClicking) {
		await (browser.action
			? browser.action.setIcon({ path: urls.iconKeyboard48.pathname })
			: browser.browserAction.setIcon({
					path: urls.iconKeyboard48.pathname,
			  }));
	}

	// We clean up the tabs in hintsToggleTabs on start
	await store("hintsToggleTabs", new Map());

	// Reset tabsByRecency on start
	await store("tabsByRecency", {});

	// Track tabs to be able to use the command "tab back"
	await trackRecentTabs();

	watchNavigation();

	if (
		(await retrieve("showWhatsNewPageOnUpdate")) &&
		process.env["NODE_ENV"] === "production"
	) {
		const version = browser.runtime.getManifest().version;
		if ((await retrieve("lastWhatsNewPageShowed")) !== version) {
			await browser.tabs.create({ url: urls.whatsNewPage.href });
			await store("lastWhatsNewPageShowed", version);
		}
	}
}
