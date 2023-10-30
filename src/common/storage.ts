/* eslint-disable no-await-in-loop */
import { Mutex } from "async-mutex";
import browser from "webextension-polyfill";
import {
	CustomSelectorsForPattern,
	StorageSchema,
	zStorageSchema,
} from "../typings/StorageSchema";
import { defaultStorage } from "./defaultStorage";
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

/**
 * Store the value in local storage. If it is a setting it checks its validity.
 * Returns the value stored or the previous value if it was an invalid setting.
 */
export async function store<T extends keyof StorageSchema>(
	key: T,
	value: StorageSchema[T]
): Promise<StorageSchema[T]> {
	if (isSetting(key) && !isValidSetting(key, value)) return retrieve(key);

	const stringified = JSON.stringify(value, replacer);

	await (useLocalStorage.has(key)
		? browser.storage.local.set({ [key]: stringified })
		: browser.storage.sync.set({ [key]: stringified }));

	return value;
}

async function parseStorageItem(key: keyof StorageSchema) {
	const record = useLocalStorage.has(key)
		? await browser.storage.local.get(key)
		: await browser.storage.sync.get(key);

	try {
		// The value jsonString should be either a string (we store all the values as
		// strings) or undefined if the value hasn't yet been stored.
		const [jsonString] = Object.values(record) as [string | undefined];

		if (jsonString === undefined) return undefined;

		return JSON.parse(jsonString, reviver) as unknown;
	} catch {
		// Handle the storage item being wrongly altered externally. For example,
		// the user storing the item from the devtools directly.
		console.warn(
			`Malformed JSON in storage item "${key}". Resetting to default.`
		);
		return store(key, defaultStorage[key]);
	}
}

/**
 * Handle initialization, conversion or resetting to default of storage item.
 * Returns the stored item.
 */
async function initStorageItem<T extends keyof StorageSchema>(key: T) {
	const item = await parseStorageItem(key);

	// Handle customSelectors type conversion from an object to a Map. This is
	// only necessary temporarily in order not to lose user's customizations.
	// Introduced in v0.5.0.
	if (item && key === "customSelectors") {
		try {
			const normalized = new Map<string, CustomSelectorsForPattern>(
				Object.entries(item as Record<string, CustomSelectorsForPattern>)
			) as StorageSchema[T];

			const parsed = zStorageSchema.shape[key].parse(
				normalized
			) as StorageSchema[T];
			return await store(key, parsed);
		} catch {
			return store(key, defaultStorage[key]);
		}
	}

	return store(key, defaultStorage[key]);
}

const mutex = new Mutex();

/**
 * Retrieve an item from storage. It will take care of initializing, resetting
 * or converting the value if the type changed.
 */
export async function retrieve<T extends keyof StorageSchema>(
	key: T
): Promise<StorageSchema[T]> {
	const item = await parseStorageItem(key);

	const parseResult = zStorageSchema.shape[key].safeParse(item);

	if (!parseResult.success) {
		return mutex.runExclusive(async () => {
			// We parse again because another call to retrieve could have changed it.
			const itemNow = await parseStorageItem(key);
			try {
				return zStorageSchema.shape[key].parse(itemNow) as StorageSchema[T];
			} catch {
				return initStorageItem(key);
			}
		});
	}

	return parseResult.data as StorageSchema[T];
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
