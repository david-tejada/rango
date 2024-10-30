import { Mutex } from "async-mutex";
import browser from "webextension-polyfill";
import { letterHints } from "../../common/allHints";
import { retrieve, store } from "../../common/storage";
import { type TabMarkers } from "../../typings/StorageSchema";
import {
	sendMessage,
	UnreachableContentScriptError,
} from "../messaging/backgroundMessageBroker";

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
			await sendMessage("refreshTitleDecorations", undefined, {
				tabId: tab.id,
			});
		} catch (error: unknown) {
			if (!(error instanceof UnreachableContentScriptError)) throw error;

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
