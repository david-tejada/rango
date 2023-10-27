/* eslint-disable no-await-in-loop */
import browser from "webextension-polyfill";
import { z } from "zod";
import {
	CustomSelectorsForPattern,
	StorageSchema,
	zStorageSchema,
} from "../typings/StorageSchema";
import {
	Settings,
	defaultSettings,
	isSetting,
	isValidSetting,
} from "./settings";

const useLocalStorage = new Set<keyof StorageSchema>([
	"hintsToggleTabs",
	"tabsByRecency",
	"hintsStacks",
	"tabMarkers",
]);

// https://stackoverflow.com/a/56150320
function replacer(_key: string, value: any) {
	if (value instanceof Map) {
		return {
			dataType: "Map",
			value: Array.from(value.entries()),
		};
	}

	return value as unknown;
}

function reviver(_key: string, value: any) {
	if (
		typeof value === "object" &&
		value !== null &&
		value.dataType === "Map" &&
		value.value
	) {
		return new Map(value.value);
	}

	return value as unknown;
}

export async function store<T extends keyof StorageSchema>(
	key: T,
	value: StorageSchema[T],
	sync?: boolean
): Promise<void> {
	if (isSetting(key) && !isValidSetting(key, value)) return;

	const stringified = JSON.stringify(value, replacer);

	await (sync === false || (sync === undefined && useLocalStorage.has(key))
		? browser.storage.local.set({ [key]: stringified })
		: browser.storage.sync.set({ [key]: stringified }));
}

/**
 * Check if an item is found in local/sync storage. It will also return false if
 * the item is found in storage but the value has the wrong format. This can be
 * useful in case we need to change an item from, for example, an Object to a
 * Map.
 */
export async function storageHas<T extends keyof StorageSchema>(
	key: T,
	sync?: boolean
) {
	try {
		await retrieve(key, sync);
		return true;
	} catch (error: unknown) {
		if (error instanceof ReferenceError) return false;
		throw error;
	}
}

/**
 * Store an item if it hasn't been stored yet.
 */
export async function storeIfUndefined<T extends keyof StorageSchema>(
	key: T,
	value: StorageSchema[T],
	sync?: boolean
) {
	try {
		await retrieve(key, sync);
	} catch (error: unknown) {
		if (error instanceof ReferenceError) return store(key, value, sync);
		throw error;
	}
}

/**
 * Transform a storage item if the type has changed.
 */
function transformStorageItem<T extends keyof StorageSchema>(
	key: T,
	value: unknown
): StorageSchema[T] {
	switch (key) {
		case "tabsByRecency":
			return new Map() as StorageSchema[T];
		case "customSelectors":
			return new Map<string, CustomSelectorsForPattern>(
				Object.entries(value as Record<string, CustomSelectorsForPattern>)
			) as StorageSchema[T];
		default:
			return value as StorageSchema[T];
	}
}

/**
 * Retrieve an item from local or sync storage. It will throw a ReferenceError
 * if the item is not stored. It will also take care of transforming any value
 * that was stored with a different format as the current one.
 */
export async function retrieve<T extends keyof StorageSchema>(
	key: T,
	sync?: boolean
): Promise<StorageSchema[T]> {
	const record =
		sync === false || (sync === undefined && useLocalStorage.has(key))
			? await browser.storage.local.get(key)
			: await browser.storage.sync.get(key);

	// The value jsonString should be either a string (we store all the values as
	// strings) or undefined if the value hasn't been stored yet.
	const [jsonString] = Object.values(record) as [unknown];
	const jsonParseResult = z.string().safeParse(jsonString);

	if (!jsonParseResult.success) {
		throw new ReferenceError("Trying to retrieve an undefined storage item.");
	}

	const retrievedObject = JSON.parse(jsonParseResult.data, reviver) as unknown;
	const objectParseResult =
		zStorageSchema.shape[key].safeParse(retrievedObject);

	const parsedValue = objectParseResult.success
		? (objectParseResult.data as StorageSchema[T])
		: (zStorageSchema.shape[key].parse(
				transformStorageItem(key, retrievedObject)
		  ) as StorageSchema[T]);

	// We store the item if it was transformed.
	if (!objectParseResult.success) await store(key, parsedValue, sync);

	return parsedValue;
}

export async function retrieveSettings() {
	const settings: any = {};
	let key: keyof Settings;

	for (key in defaultSettings) {
		if (Object.prototype.hasOwnProperty.call(defaultSettings, key)) {
			settings[key] = await retrieve(key);
		}
	}

	return settings as Settings;
}
