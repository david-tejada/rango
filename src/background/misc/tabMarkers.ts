import browser from "webextension-polyfill";
import { Mutex } from "async-mutex";
import { retrieve, store } from "../../common/storage";
import { TabMarkers } from "../../typings/StorageSchema";
import { letterHints } from "../utils/allHints";
import { sendRequestToContent } from "../messaging/sendRequestToContent";

const mutex = new Mutex();

async function withTabMarkers<T>(
	callback: (tabMarkers: TabMarkers) => T
): Promise<T> {
	return mutex.runExclusive(async () => {
		const tabMarkers = await retrieve("tabMarkers");

		const result = callback(tabMarkers);
		await store("tabMarkers", tabMarkers);
		return result;
	});
}

export async function getTabMarker(tabId: number) {
	return withTabMarkers(({ free, tabIdsToMarkers, markersToTabIds }) => {
		const marker = tabIdsToMarkers.get(tabId) ?? free.pop();

		if (!marker) return "";

		tabIdsToMarkers.set(tabId, marker);
		markersToTabIds.set(marker, tabId);

		return marker;
	});
}

async function assignTabMarker(tabId: number, marker: string) {
	return withTabMarkers(({ free, tabIdsToMarkers, markersToTabIds }) => {
		if (!free.includes(marker)) {
			throw new Error(
				`Unable to assign marker ${marker} as it's already in use`
			);
		}

		const markerIndex = free.indexOf(marker);
		free.splice(markerIndex, 1);

		tabIdsToMarkers.set(tabId, marker);
		markersToTabIds.set(marker, tabId);
	});
}

export async function getTabIdForMarker(marker: string) {
	return withTabMarkers(({ markersToTabIds }) => {
		const tabId = markersToTabIds.get(marker);
		if (!tabId) {
			throw new Error(`No tab with the marker "${marker}"`);
		}

		return tabId;
	});
}

async function releaseMarker(tabId: number) {
	const marker = await getTabMarker(tabId);
	if (!marker) return;

	await withTabMarkers(({ free, tabIdsToMarkers, markersToTabIds }) => {
		tabIdsToMarkers.delete(tabId);
		markersToTabIds.delete(marker);
		free.push(marker);
		free.sort((a, b) => b.length - a.length || b.localeCompare(a));
	});
}

browser.tabs.onRemoved.addListener(async (tabId) => {
	await releaseMarker(tabId);
});

// In Chrome when a tab is discarded it changes its id
browser.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
	await withTabMarkers(({ tabIdsToMarkers, markersToTabIds }) => {
		const tabMarker = tabIdsToMarkers.get(removedTabId);
		if (!tabMarker) return;

		tabIdsToMarkers.delete(removedTabId);
		tabIdsToMarkers.set(addedTabId, tabMarker);
		markersToTabIds.set(tabMarker, addedTabId);
	});
});

async function resetTabMarkers() {
	await withTabMarkers((tabMarkers) => {
		tabMarkers.free = [...letterHints];
		tabMarkers.tabIdsToMarkers = new Map();
		tabMarkers.markersToTabIds = new Map();

		return tabMarkers;
	});
}

export async function initTabMarkers() {
	await resetTabMarkers();

	// We need to assign the tab markers to their corresponding tab id in case
	// the user has the setting "Continue where you left off" enabled. If we don't
	// those tabs will have an invalid tab marker.

	if (!(await retrieve("includeTabMarkers"))) return;

	const tabs = await browser.tabs.query({});

	const getMarkerFromTitle = (title: string) => {
		return /^([a-z]{1,2}) \| /i.exec(title)?.[1]?.toLowerCase();
	};

	await Promise.allSettled(
		tabs.map(async ({ title, id }) => {
			if (!title || !id) return;

			const marker = getMarkerFromTitle(title);
			if (!marker) return;

			try {
				await assignTabMarker(id, marker);
			} catch {
				// If the tab marker is already in use we reload the tab so it gets a
				// new one. I'm not entirely sure if this is necessary but I leave it
				// here just to be safe.
				return browser.tabs.reload(id);
			}
		})
	);
}

export async function refreshTabMarkers() {
	await resetTabMarkers();

	const tabs = await browser.tabs.query({});

	const refreshing = tabs.map(async (tab) => {
		try {
			await sendRequestToContent({ type: "refreshTitleDecorations" }, tab.id);
		} catch {
			return browser.tabs.reload(tab.id);
		}
	});

	await Promise.allSettled(refreshing);
}
