import { Mutex } from "async-mutex";
import { debounce } from "lodash";
import browser from "webextension-polyfill";
import { type LabelStack } from "../../typings/LabelStack";
import { type StorageSchema } from "../../typings/StorageSchema";
import { type TabMarkers } from "../../typings/TabMarkers";
import { defaultSettings } from "../settings/settings";
import { fromSerializable, toSerializable } from "./serializable";

type Store = {
	[K in keyof StorageSchema]: StorageSchema[K];
} & {
	tabsByRecency: number[];
	tabMarkers: TabMarkers;
	showWhatsNewPageNextStartup: boolean;
} & Record<`labelStack:${number}`, LabelStack>;

const cache = new Map<keyof Store, Store[keyof Store]>();
const pendingStorageChanges = new Map<keyof Store, Store[keyof Store]>();
const mutexes = new Map<keyof Store, Mutex>();

// Service workers terminate after 30 seconds of inactivity. Setting it safely
// less than that to be cautious.
// https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle#idle-shutdown
const debounceWait = 10_000;

/**
 * Get a value from the appropriate storage area. It handles conversion from
 * serializable objects to Maps.
 */
async function get<T extends keyof Store>(
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
 * making Maps serializable.
 */
async function set<T extends keyof Store>(key: T, value: Store[T]) {
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

async function remove<T extends keyof Store>(keys: T | T[]) {
	const keysArray = Array.isArray(keys) ? keys : [keys];

	await Promise.all(
		keysArray.map(async (key) => {
			cache.delete(key);
			pendingStorageChanges.delete(key);
			await getStorageArea(key).remove(key);
		})
	);
}

/**
 * Executes a callback with exclusive access to a stored value.
 *
 * @param key - The storage key to lock
 * @param callback - Function to execute with the locked value. Must return a
 * tuple of [updatedValue, result?]
 * @param initializer - Optional function to initialize the value if it doesn't exist
 * @returns The optional result from the callback, or undefined
 * @throws Error if no value exists for the given key and no initializer is provided
 */
async function withLock<T extends keyof Store, U = void>(
	key: T,
	callback: (value: Store[T]) => Promise<[Store[T], U?]> | [Store[T], U?],
	initializer?: () => Promise<Store[T]> | Store[T]
): Promise<U> {
	const mutex = getMutex(key);

	try {
		return await mutex.runExclusive(async () => {
			let value = await get(key);

			if (value === undefined) {
				if (initializer) {
					value = await initializer();
				} else {
					throw new Error(
						`No value exists for key "${key}" and no initializer was provided`
					);
				}
			}

			const [updatedValue, result] = await callback(value);

			await set(key, updatedValue);
			return result as U;
		});
	} finally {
		if (!mutex.isLocked()) mutexes.delete(key);
	}
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

function getMutex(key: keyof Store) {
	if (mutexes.has(key)) return mutexes.get(key)!;

	const mutex = new Mutex();
	mutexes.set(key, mutex);

	return mutex;
}

export const store = { get, set, remove, withLock };
