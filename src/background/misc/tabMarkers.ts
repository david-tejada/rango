import browser from "webextension-polyfill";
import { Mutex } from "async-mutex";
import { retrieve, store } from "../../common/storage";
import { TabMarkers } from "../../typings/StorageSchema";

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

		if (!marker) {
			throw new Error("No more tab markers available");
		}

		tabIdsToMarkers.set(tabId, marker);
		markersToTabIds.set(marker, tabId);

		return marker;
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
