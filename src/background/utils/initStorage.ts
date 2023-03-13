/* eslint-disable no-await-in-loop */
import browser from "webextension-polyfill";
import keyboardClickingIconUrl from "url:../../assets/icon-keyboard-clicking48.png";
import { Options } from "../../typings/Storage";
import {
	retrieve,
	storageHas,
	store,
	storeIfUndefined,
} from "../../common/storage";

const defaultOptions: Options = {
	hintFontSize: 10,
	hintsToggleGlobal: true,
	hintsToggleHosts: new Map(),
	hintsTogglePaths: new Map(),
	hintsToggleTabs: new Map(),
	hintWeight: "auto",
	hintStyle: "boxed",
	includeSingleLetterHints: true,
	urlInTitle: true,
	keyboardClicking: false,
	customSelectors: {},
};

// We only need this function temporarily while the users go from a version
// below 0.3.5 to a version equal or above it. To be removed in the future.
async function switchToSyncStorage() {
	let key: keyof typeof defaultOptions;
	const storing: Array<Promise<void>> = [];

	for (key in defaultOptions) {
		if (Object.prototype.hasOwnProperty.call(defaultOptions, key)) {
			const hasLocal = await storageHas(key, false);
			if (hasLocal) {
				const value = await retrieve(key, false);
				storing.push(store(key, value));
			}
		}
	}

	await Promise.all(storing);
}

async function clearUnusedStacks() {
	const tabs = await browser.tabs.query({});
	const tabIds = new Set(tabs.map((tab) => tab.id));
	const stacks = (await storageHas("hintsStacks"))
		? await retrieve("hintsStacks")
		: new Map();

	for (const [tabId] of stacks) {
		if (!tabIds.has(tabId)) {
			stacks.delete(tabId);
		}
	}

	await store("hintsStacks", stacks);
}

export async function initStorage() {
	await switchToSyncStorage();
	await clearUnusedStacks();

	let key: keyof Options;
	const storing: Array<Promise<void>> = [];

	for (key in defaultOptions) {
		if (Object.prototype.hasOwnProperty.call(defaultOptions, key)) {
			storing.push(storeIfUndefined(key, defaultOptions[key]));
		}
	}

	await Promise.all(storing);

	const keyboardClicking = await retrieve("keyboardClicking");

	if (keyboardClicking) {
		await (browser.action
			? browser.action.setIcon({ path: keyboardClickingIconUrl })
			: browser.browserAction.setIcon({ path: keyboardClickingIconUrl }));
	}

	// We clean up the tabs in hintsToggleTabs on start
	await store("hintsToggleTabs", new Map());

	// Reset tabsByRecency on start
	await store("tabsByRecency", {});
}
