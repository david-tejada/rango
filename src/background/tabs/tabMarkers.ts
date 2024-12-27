import browser from "webextension-polyfill";
import { letterLabels } from "../../common/labels";
import { retrieve } from "../../common/storage/storage";
import {
	sendMessage,
	UnreachableContentScriptError,
} from "../messaging/backgroundMessageBroker";
import { withLockedStorageAccess } from "../utils/withLockedStorageValue";

export async function getTabMarker(tabId: number) {
	return withLockedStorageAccess("tabMarkers", ({ free, assigned }) => {
		const marker = assigned.get(tabId) ?? free.pop();
		if (!marker) return "";
		assigned.set(tabId, marker);
		return marker;
	});
}

async function assignTabMarker(tabId: number, marker: string) {
	return withLockedStorageAccess("tabMarkers", ({ free, assigned }) => {
		if (!free.includes(marker)) {
			throw new Error(
				`Unable to assign marker ${marker} as it's already in use`
			);
		}

		const markerIndex = free.indexOf(marker);
		free.splice(markerIndex, 1);

		assigned.set(tabId, marker);
	});
}

export async function getTabIdForMarker(marker: string) {
	return withLockedStorageAccess("tabMarkers", ({ assigned }) => {
		for (const [tabId, currentMarker] of assigned.entries()) {
			if (currentMarker === marker) {
				return tabId;
			}
		}

		throw new Error(`No tab with the marker "${marker}"`);
	});
}

async function releaseMarker(tabId: number) {
	const marker = await getTabMarker(tabId);
	if (!marker) return;

	await withLockedStorageAccess("tabMarkers", ({ free, assigned }) => {
		assigned.delete(tabId);
		free.push(marker);
		free.sort((a, b) => b.length - a.length || b.localeCompare(a));
	});
}

browser.tabs.onRemoved.addListener(async (tabId) => {
	await releaseMarker(tabId);
});

// In Chrome when a tab is discarded it changes its id
browser.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
	await withLockedStorageAccess("tabMarkers", ({ assigned }) => {
		const tabMarker = assigned.get(removedTabId);
		if (!tabMarker) return;

		assigned.delete(removedTabId);
		assigned.set(addedTabId, tabMarker);
	});
});

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

async function resetTabMarkers() {
	await withLockedStorageAccess("tabMarkers", (tabMarkers) => {
		tabMarkers.free = [...letterLabels];
		tabMarkers.assigned = new Map();
		return tabMarkers;
	});
}
