import { debounce } from "lodash";
import browser from "webextension-polyfill";
import { type StorageSchema } from "../../typings/StorageSchema";
import { defaultSettings } from "../settings/settings";
import { fromSerializable, toSerializable } from "./serializable";

type TabMarkers = {
	free: number[];
	assigned: Map<number, string>;
};

type LabelStack = {
	free: string[];
	assigned: Map<string, number>;
};

type Store = {
	[K in keyof StorageSchema]: StorageSchema[K];
} & {
	tabsByRecency: number[];
	tabMarkers: TabMarkers;
	showWhatsNewPageNextStartup: boolean;
} & Record<`labelStack:${number}`, LabelStack>;

const cache = new Map<keyof Store, Store[keyof Store]>();
const pendingStorageChanges = new Map<keyof Store, Store[keyof Store]>();

// Service workers terminate after 30 seconds of inactivity. Setting it safely
// less than that to be cautious.
// https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle#idle-shutdown
const debounceWait = 10_000;

/**
 * Get a value from the appropriate storage area. It handles making Maps
 * serializable.
 */
export async function get<T extends keyof Store>(
	key: T
): Promise<Store[T] | undefined> {
	if (cache.has(key)) return cache.get(key) as Store[T];

	const record = await getStorageArea(key).get(key);
	const value = fromSerializable(record[key]) as Store[T];

	cache.set(key, value);
	return value;
}

/**
 * Set a value for a given key in the appropriate storage area. It handles
 * conversion from serializable objects to Maps.
 */
export async function set<T extends keyof Store>(key: T, value: Store[T]) {
	cache.set(key, value);

	// Settings need to be stored right away because we have storage change
	// listeners that need to be triggered immediately.
	if (isSetting(key)) {
		try {
			await getStorageArea(key).set({ [key]: toSerializable(value) });
		} catch (error) {
			cache.delete(key);
			throw error;
		}
	}

	storeWithDebounce(key, value);
}

const debouncedFlushStorageChanges = debounce(async () => {
	const entries = [...pendingStorageChanges.entries()];
	pendingStorageChanges.clear();

	await Promise.allSettled(
		entries.map(async ([key, value]) => {
			try {
				await getStorageArea(key).set({ [key]: toSerializable(value) });
			} catch (error) {
				// The only circumstance I can think this will fail is if we exceed the
				// 5MB local storage limit (settings are stored right away in sync
				// storage). I don't expect that ever to happen but if it does I think
				// it's more graceful to keep the value in the cache and retry later
				// when space might have been freed.
				console.error(`Failed to store "${key}"`, error);
				if (!pendingStorageChanges.has(key)) {
					pendingStorageChanges.set(key, value);
				}
			}
		})
	);
}, debounceWait);

function storeWithDebounce<T extends keyof Store>(key: T, value: Store[T]) {
	pendingStorageChanges.set(key, value);
	void debouncedFlushStorageChanges();
}

function getStorageArea(key: keyof Store) {
	return isSetting(key) ? browser.storage.sync : browser.storage.local;
}

function isSetting(key: keyof Store) {
	return key in defaultSettings;
}

export const store = { get, set };
