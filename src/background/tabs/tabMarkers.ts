import browser from "webextension-polyfill";
import { letterLabels } from "../../common/labels";
import { store } from "../../common/storage/store";
import { type TabMarkers } from "../../typings/TabMarkers";
import { sendMessage } from "../messaging/sendMessage";
import { UnreachableContentScriptError } from "../messaging/UnreachableContentScriptError";

export async function getTabMarker(tabId: number) {
	const { assigned } = await store.waitFor("tabMarkers");
	return assigned[tabId];
}

export async function getTabIdForMarker(marker: string) {
	const { assigned } = await store.waitFor("tabMarkers");

	for (const tabId in assigned) {
		if (assigned[tabId] === marker) {
			return Number(tabId);
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
	const tabs = await browser.tabs.query({});
	const tabsAndTheirMarkers = tabs
		.filter((tab) => isTabWithId(tab))
		.map((tab) => ({ tab, marker: getMarkerFromTitle(tab.title!) }));
	const tabsWithMarkers = tabsAndTheirMarkers.filter((tab) => tab.marker);
	const tabsWithoutMarkers = tabsAndTheirMarkers.filter((tab) => !tab.marker);

	const tabMarkers = createTabMarkers();
	// First assign markers to tabs that already have them
	for (const { tab, marker } of tabsWithMarkers) {
		assignMarkerToTab(tabMarkers, tab.id, marker);
	}

	// Then assign new markers to tabs that don't have them
	for (const { tab } of tabsWithoutMarkers) {
		assignMarkerToTab(tabMarkers, tab.id);
	}

	await store.set("tabMarkers", tabMarkers);
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
	const tabs = await browser.tabs.query({});
	const tabWithIds = tabs.filter((tab) => isTabWithId(tab));

	// We remove the value here to make sure the initializer is called and using
	// `store.waitFor` will wait for the value to be set after the markers have
	// been reassigned
	await store.remove("tabMarkers");
	await store.withLock(
		"tabMarkers",
		async (tabMarkers) => {
			const { free, assigned } = tabMarkers;

			for (const tab of tabWithIds) {
				const marker = free.pop();
				if (marker) assigned[tab.id] = marker;
			}

			return [tabMarkers];
		},
		createTabMarkers
	);

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
		const marker = assignMarkerToTab(tabMarkers, tabId, preferredMarker);
		return [tabMarkers, marker];
	});
}

/**
 * Releases the tab marker for the given tab id.
 *
 * @param tabId - The tab id to release the marker for.
 * @returns The released marker or undefined if the tab doesn't have a marker.
 */
async function releaseTabMarker(tabId: number) {
	return store.withLock(
		"tabMarkers",
		async (tabMarkers) => {
			const { free, assigned } = tabMarkers;

			const marker = assigned[tabId];
			if (!marker) return [tabMarkers];

			delete assigned[tabId];
			free.push(marker);
			free.sort((a, b) => b.length - a.length || b.localeCompare(a));

			return [tabMarkers, marker];
		},
		createTabMarkers
	);
}

/**
 * Assigns a marker to a tab, modifying the TabMarkers object in place.
 *
 * @param tabMarkers - The TabMarkers object to modify
 * @param tabId - The tab id to set the marker for
 * @param preferredMarker - Optional preferred marker to use
 * @returns The marker that was assigned, if any
 */
function assignMarkerToTab(
	tabMarkers: TabMarkers,
	tabId: number,
	preferredMarker?: string
) {
	if (preferredMarker && tabMarkers.free.includes(preferredMarker)) {
		const markerIndex = tabMarkers.free.indexOf(preferredMarker);
		tabMarkers.free.splice(markerIndex, 1);
		tabMarkers.assigned[tabId] = preferredMarker;
		return preferredMarker;
	}

	const newMarker = tabMarkers.free.pop();
	if (newMarker) {
		tabMarkers.assigned[tabId] = newMarker;
		return newMarker;
	}

	return undefined;
}

function createTabMarkers(): TabMarkers {
	return {
		free: [...letterLabels],
		assigned: {},
	};
}

function getMarkerFromTitle(title: string) {
	// Extract tab marker (matches both "A|" and "A | " formats)
	return /^([a-z]{1,2}) ?\| ?/i.exec(title)?.[1]?.toLowerCase();
}

function isTabWithId(
	tab: browser.Tabs.Tab
): tab is browser.Tabs.Tab & { id: number } {
	return tab.id !== undefined;
}
