import browser from "webextension-polyfill";
import { letterLabels } from "../../common/labels";
import { store } from "../../common/storage/store";
import { type TabMarkers } from "../../typings/TabMarkers";
import { sendMessage } from "../messaging/sendMessage";
import { UnreachableContentScriptError } from "../messaging/UnreachableContentScriptError";

async function initTabMarkers() {
	const tabMarkers = createTabMarkers();
	await store.set("tabMarkers", tabMarkers);
	return tabMarkers;
}

async function getTabMarkers(): Promise<TabMarkers> {
	return (await store.get("tabMarkers")) ?? initTabMarkers();
}

export async function getTabMarker(tabId: number) {
	const { assigned } = await getTabMarkers();
	const marker = assigned.get(tabId);
	return marker;
}

export async function getTabIdForMarker(marker: string) {
	const { assigned } = await getTabMarkers();
	for (const [tabId, currentMarker] of assigned.entries()) {
		if (currentMarker === marker) {
			return tabId;
		}
	}

	throw new Error(`No tab with the marker "${marker}"`);
}

/**
 * Initializes and reconciles the tab markers. It will assign tab markers to the
 * tabs that already have one in their title in case the user has the setting
 * "Continue where you left off" enabled.
 */
export async function initializeAndReconcileTabMarkers() {
	await initTabMarkers();

	// We need to assign the tab markers to their corresponding tab id in case
	// the user has the setting "Continue where you left off" enabled. If we
	// don't those tabs will have an invalid tab marker.

	const tabs = await browser.tabs.query({});

	const tabsAndTheirMarkers = tabs
		.filter((tab) => isTabWithId(tab))
		.map((tab) => ({ tab, marker: getMarkerFromTitle(tab.title!) }));

	const tabsWithMarkers = tabsAndTheirMarkers.filter((tab) => tab.marker);
	const tabsWithoutMarkers = tabsAndTheirMarkers.filter((tab) => !tab.marker);

	// In order to avoid having to reload tabs that already have a tab marker
	// in their title we first try to assign tab markers to the tabs that
	// already have one.
	await Promise.all(
		tabsWithMarkers.map(async ({ tab, marker }) => setTabMarker(tab.id, marker))
	);

	// Then the rest.
	await Promise.all(
		tabsWithoutMarkers.map(async ({ tab }) => setTabMarker(tab.id))
	);
}

/**
 * Adds listeners to the tab cycle events to update the tab markers.
 */
export function addTabMarkerListeners() {
	browser.tabs.onCreated.addListener(async ({ id }) => {
		if (id) await setTabMarker(id);
	});

	browser.tabs.onRemoved.addListener(async (tabId) => {
		await releaseTabMarker(tabId);
	});

	// In Chrome when a tab is discarded it changes its id
	browser.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
		const marker = await releaseTabMarker(removedTabId);
		await setTabMarker(addedTabId, marker);
	});
}

export async function refreshTabMarkers() {
	await initTabMarkers();

	const tabs = await browser.tabs.query({});
	const tabWithIds = tabs.filter((tab) => isTabWithId(tab));

	await store.withLock("tabMarkers", async (tabMarkers) => {
		const { free, assigned } = tabMarkers;

		for (const tab of tabWithIds) {
			const marker = free.pop();
			if (marker) assigned.set(tab.id, marker);
		}

		return [tabMarkers];
	});

	const refreshing = tabWithIds.map(async (tab) => {
		try {
			await sendMessage("refreshTitleDecorations", undefined, {
				tabId: tab.id,
			});
		} catch (error: unknown) {
			if (!(error instanceof UnreachableContentScriptError)) {
				// We simply log the error. We don't throw because we don't want the
				// whole command to fail if one tab fails
				console.error(error);
			}

			// We reload if the tab has been discarded and the content script isn't
			// running any more. I could check the `discarded` property of the tab but
			// I think I did that before and for whatever reason it didn't handle all
			// cases. This will make that we also reload any tabs where the content
			// script can't run. I think that's ok.
			await browser.tabs.reload(tab.id);
		}
	});

	await Promise.all(refreshing);
}

/**
 * Sets the tab marker for the given tab id.
 *
 * @param tabId - The tab id to set the marker for.
 * @param preferredMarker - The preferred marker to use.
 * @returns The marker that was set.
 */
async function setTabMarker(tabId: number, preferredMarker?: string) {
	return store.withLock("tabMarkers", async (tabMarkers) => {
		const { free, assigned } = tabMarkers;

		if (preferredMarker && free.includes(preferredMarker)) {
			const markerIndex = free.indexOf(preferredMarker);
			free.splice(markerIndex, 1);
			assigned.set(tabId, preferredMarker);

			return [tabMarkers, preferredMarker];
		}

		const newMarker = free.pop();
		if (newMarker) assigned.set(tabId, newMarker);

		return [tabMarkers, newMarker];
	});
}

/**
 * Releases the tab marker for the given tab id.
 *
 * @param tabId - The tab id to release the marker for.
 * @returns The released marker or undefined if the tab doesn't have a marker.
 */
async function releaseTabMarker(tabId: number) {
	return store.withLock("tabMarkers", async (tabMarkers) => {
		const { free, assigned } = tabMarkers;

		const marker = assigned.get(tabId);
		if (!marker) return [tabMarkers];

		assigned.delete(tabId);
		free.push(marker);
		free.sort((a, b) => b.length - a.length || b.localeCompare(a));

		return [tabMarkers, marker];
	});
}

function createTabMarkers(): TabMarkers {
	return {
		free: [...letterLabels],
		assigned: new Map(),
	};
}

function getMarkerFromTitle(title: string) {
	return /^([a-z]{1,2}) \| /i.exec(title)?.[1]?.toLowerCase();
}

function isTabWithId(
	tab: browser.Tabs.Tab
): tab is browser.Tabs.Tab & { id: number } {
	return tab.id !== undefined;
}
