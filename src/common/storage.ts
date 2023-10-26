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
		const retrieved = await retrieve(key, sync);
		return zStorageSchema.shape[key].safeParse(retrieved).success;
	} catch {
		return false;
	}
}

/**
 * Store an item if it hasn't been stored yet or if it was stored with the wrong
 * format.
 */
export async function storeIfUndefined<T extends keyof StorageSchema>(
	key: T,
	value: StorageSchema[T],
	sync?: boolean
) {
	const stored = await storageHas(key, sync);
	if (!stored) await store(key, value, sync);
}

/**
 * Retrieve an item from local or sync storage. It will throw an error if the
 * item is not stored.
 */
export async function retrieve<T extends keyof StorageSchema>(
	key: T,
	sync?: boolean
): Promise<StorageSchema[T]> {
	const retrieved =
		sync === false || (sync === undefined && useLocalStorage.has(key))
			? await browser.storage.local.get(key)
			: await browser.storage.sync.get(key);

	// The value jsonString should be either a string (we store all the values as
	// strings) or undefined if the value hasn't been stored yet.
	const [jsonString] = Object.values(retrieved) as [unknown];
	const parsedString = z.string().safeParse(jsonString);

	if (!parsedString.success) {
		throw new Error("Trying to retrieve an undefined storage item");
	}

	const parsedValue = JSON.parse(
		parsedString.data,
		reviver
	) as StorageSchema[T];

	// Handle customSelectors type conversion from an object to a Map. This is
	// only necessary temporarily in order not to lose user's customizations.
	// Introduced in v0.5.0.
	if (key === "customSelectors" && !(parsedValue instanceof Map)) {
		const customSelectorsMap = new Map<string, CustomSelectorsForPattern>(
			Object.entries(parsedValue)
		);

		await store<"customSelectors">(key, customSelectorsMap, sync);

		return customSelectorsMap as StorageSchema[T];
	}

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
