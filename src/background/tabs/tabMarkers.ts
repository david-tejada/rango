import browser from "webextension-polyfill";
import { letterLabels } from "../../common/labels";
import { retrieve } from "../../common/storage/storage";
import {
	sendMessage,
	UnreachableContentScriptError,
} from "../messaging/backgroundMessageBroker";
import { withLockedStorageAccess } from "../utils/withLockedStorageValue";

function isTabWithId(
	tab: browser.Tabs.Tab
): tab is browser.Tabs.Tab & { id: number } {
	return tab.id !== undefined;
}

export async function getTabMarker(tabId: number) {
	const { assigned } = await retrieve("tabMarkers");
	const marker = assigned.get(tabId);
	return marker;
}

export async function getTabIdForMarker(marker: string) {
	const { assigned } = await retrieve("tabMarkers");
	for (const [tabId, currentMarker] of assigned.entries()) {
		if (currentMarker === marker) {
			return tabId;
		}
	}

	throw new Error(`No tab with the marker "${marker}"`);
}

/**
 * Initializes the tab markers.
 *
 * It will assign tab markers to the tabs that already have one in their title
 * in case the user has the setting "Continue where you left off" enabled.
 */
export async function initTabMarkers() {
	await resetTabMarkers();

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
	await resetTabMarkers();

	const tabs = await browser.tabs.query({});
	const tabWithIds = tabs.filter((tab) => isTabWithId(tab));

	await withLockedStorageAccess("tabMarkers", ({ free, assigned }) => {
		for (const tab of tabWithIds) {
			const marker = free.pop();
			if (marker) assigned.set(tab.id, marker);
		}
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
	return withLockedStorageAccess("tabMarkers", ({ free, assigned }) => {
		if (preferredMarker && free.includes(preferredMarker)) {
			const markerIndex = free.indexOf(preferredMarker);
			free.splice(markerIndex, 1);
			assigned.set(tabId, preferredMarker);

			return preferredMarker;
		}

		const newMarker = free.pop();
		if (newMarker) assigned.set(tabId, newMarker);

		return newMarker;
	});
}

/**
 * Releases the tab marker for the given tab id.
 *
 * @param tabId - The tab id to release the marker for.
 * @returns The released marker or undefined if the tab doesn't have a marker.
 */
async function releaseTabMarker(tabId: number) {
	return withLockedStorageAccess("tabMarkers", ({ free, assigned }) => {
		const marker = assigned.get(tabId);
		if (!marker) return;

		assigned.delete(tabId);
		free.push(marker);
		free.sort((a, b) => b.length - a.length || b.localeCompare(a));

		return marker;
	});
}

async function resetTabMarkers() {
	await withLockedStorageAccess("tabMarkers", (tabMarkers) => {
		tabMarkers.free = [...letterLabels];
		tabMarkers.assigned.clear();
	});
}

function getMarkerFromTitle(title: string) {
	return /^([a-z]{1,2}) \| /i.exec(title)?.[1]?.toLowerCase();
}
