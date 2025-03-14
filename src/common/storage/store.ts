import { Mutex } from "async-mutex";
import { debounce } from "lodash";
import browser from "webextension-polyfill";
import { type LabelStack } from "../../typings/LabelStack";
import { type TabMarkers } from "../../typings/TabMarkers";
import { settingsSchema, type Settings } from "../settings/settingsSchema";
import { syncStorage } from "./syncStorage";

type LabelStacks = Record<`labelStack:${number}`, LabelStack>;

type ExtensionState = LabelStacks & {
	tabsByRecency: number[];
	tabMarkers: TabMarkers;
	showWhatsNewPageNextStartup: boolean;
	hasSeenSettingsPage: boolean;
	extensionRecentlyUpdated: boolean;
};

export type Store = Settings & ExtensionState;

const settingKeys = new Set(settingsSchema.keyof().options);
const localStorageSettingKeys = new Set<keyof Settings>(["hintsToggleTabs"]);
const persistentLocalStorageKeys = new Set<keyof ExtensionState>([
	"showWhatsNewPageNextStartup",
]);

/**
 * A map of cached values in the store when the key uses the `useCache` option.
 */
const cache = new Map<keyof Store, Store[keyof Store]>();

/**
 * A map of deferred storage updates to be flushed to storage when the key uses
 * the `useCache` option.
 */
const deferredStorageUpdates = new Map<keyof Store, Store[keyof Store]>();

/**
 * The debounce wait time to flush deferred updates to storage when the key uses
 * the `useCache` option.
 */
const debounceWait = 1000;

/**
 * A map of mutexes to lock each key in the store when using `withLock`.
 */
const mutexes = new Map<keyof Store, Mutex>();

/**
 * The timeout to wait for a value to be set if it is undefined when using
 * `waitFor`.
 */
const waitForTimeout = 5000;

/**
 * A map of resolvers and timers for operations that are waiting for a value to
 * be set when using `waitFor`.
 */
const waitForResolvers = new Map<
	keyof Store,
	{ resolve: (value: any) => void; timer: NodeJS.Timeout }
>();

/**
 * Get a store value for a key.
 *
 * @param key - The key to get the value for
 *
 * @returns The value for the key, or undefined if it doesn't exist
 */
async function get<T extends keyof Store>(key: T) {
	const { storageArea, useCache } = getStorageOptions(key);

	if (useCache && cache.has(key)) {
		return cache.get(key) as Store[T];
	}

	const record = await storageArea.get(key);
	const value = record[key] as Store[T] | undefined;

	if (useCache && value !== undefined) cache.set(key, value);

	return value;
}

/**
 * Retrieves a store value, waiting for it to be set if it is undefined.
 *
 * @param key - The store key to wait for
 *
 * @returns The value once it becomes available
 * @throws Error if the timeout is reached before the value is available
 */
async function waitFor<T extends keyof Store>(key: T): Promise<Store[T]> {
	const value = await get(key);
	if (value !== undefined) return value;

	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			waitForResolvers.delete(key);
			reject(new Error(`Timeout waiting for "${key}" to be defined`));
		}, waitForTimeout);

		waitForResolvers.set(key, { resolve, timer });
	});
}

/**
 * Internal set implementation without mutex locking.
 */
async function _set<T extends keyof Store>(key: T, value: Store[T]) {
	const { storageArea, useCache } = getStorageOptions(key);

	const resolver = waitForResolvers.get(key);
	if (resolver) {
		clearTimeout(resolver.timer);
		waitForResolvers.delete(key);
		resolver.resolve(value);
	}

	if (useCache) {
		cache.set(key, value);
		storeWithDebounce(key, value);
		return;
	}

	try {
		await storageArea.set({ [key]: value });
	} catch (error) {
		cache.delete(key);
		throw error;
	}
}

/**
 * Set a value for a given key with mutex protection.
 *
 * @param key - The key to set the value for
 * @param value - The value to set
 */
async function set<T extends keyof Store>(key: T, value: Store[T]) {
	const mutex = getMutex(key);
	try {
		await mutex.runExclusive(async () => {
			await _set(key, value);
		});
	} finally {
		if (!mutex.isLocked()) mutexes.delete(key);
	}
}

/**
 * Remove a value from the store.
 *
 * @param keys - The key or keys to remove
 */
async function remove<T extends keyof Store>(keys: T | T[]) {
	const keysArray = Array.isArray(keys) ? keys : [keys];

	await Promise.all(
		keysArray.map(async (key) => {
			cache.delete(key);
			deferredStorageUpdates.delete(key);
			await getStorageOptions(key).storageArea.remove(key);
		})
	);
}

async function clearTransientData(options?: {
	skip: Array<keyof ExtensionState>;
}) {
	const record = await browser.storage.local.get();

	await Promise.all(
		Object.entries(record).map(async ([key]) => {
			if (
				!persistentLocalStorageKeys.has(key as keyof ExtensionState) &&
				!options?.skip.includes(key as keyof ExtensionState)
			) {
				await browser.storage.local.remove(key);
			}
		})
	);
}

/**
 * Executes a callback with exclusive access to a stored value.
 *
 * @param key - The storage key to lock
 * @param callback - Function to execute with the locked value. Must return a
 * tuple of [updatedValue, result?]
 * @param initializer - Optional function to initialize the value if it
 * doesn't exist
 *
 * @returns The optional result from the callback, or undefined
 * @throws Error if no value exists for the given key and no initializer is
 * provided
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

			await _set(key, updatedValue);
			return result as U;
		});
	} finally {
		if (!mutex.isLocked()) mutexes.delete(key);
	}
}

const debouncedFlushStorageUpdates = debounce(async () => {
	const entries = [...deferredStorageUpdates.entries()];
	deferredStorageUpdates.clear();

	await Promise.allSettled(
		entries.map(async ([key, value]) => {
			try {
				await getStorageOptions(key).storageArea.set({
					[key]: value,
				});
			} catch (error) {
				// The only circumstance I can think this will fail is if we exceed the
				// 5MB local storage limit (settings are stored right away in sync
				// storage). I don't expect that ever to happen but if it does I think
				// it's more graceful to keep the value in the cache and retry later
				// when space might have been freed.
				console.error(`Failed to store "${key}"`, error);
				if (!deferredStorageUpdates.has(key)) {
					deferredStorageUpdates.set(key, value);
				}
			}
		})
	);
}, debounceWait);

function storeWithDebounce<T extends keyof Store>(key: T, value: Store[T]) {
	deferredStorageUpdates.set(key, value);
	void debouncedFlushStorageUpdates();
}

function getMutex(key: keyof Store) {
	if (mutexes.has(key)) return mutexes.get(key)!;

	const mutex = new Mutex();
	mutexes.set(key, mutex);

	return mutex;
}

function getStorageOptions(key: keyof Store) {
	const isSetting = settingKeys.has(key as keyof Settings);
	const isLocalSetting =
		isSetting && localStorageSettingKeys.has(key as keyof Settings);

	return {
		storageArea:
			isSetting && !isLocalSetting ? syncStorage : browser.storage.local,
		useCache: !isSetting,
	};
}

export const store = {
	get,
	set,
	remove,
	waitFor,
	withLock,
	clearTransientData,
};
