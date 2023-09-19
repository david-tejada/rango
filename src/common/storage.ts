/* eslint-disable no-await-in-loop */
import browser from "webextension-polyfill";
import {
	CustomSelectorsForPattern,
	StorageSchema,
} from "../typings/StorageSchema";
import {
	defaultSettings,
	isSetting,
	isValidSetting,
	Settings,
} from "./settings";

const useLocalStorage = new Set<keyof StorageSchema>([
	"hintsToggleTabs",
	"tabsByRecency",
	"hintsStacks",
	"",
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

export async function storageHas<T extends keyof StorageSchema>(
	key: T,
	sync?: boolean
) {
	const retrieved =
		sync === false || (sync === undefined && useLocalStorage.has(key))
			? await browser.storage.local.get(key)
			: await browser.storage.sync.get(key);

	const value = retrieved[key] as string | undefined;

	return value !== undefined;
}

export async function storeIfUndefined<T extends keyof StorageSchema>(
	key: T,
	value: StorageSchema[T],
	sync?: boolean
): Promise<void> {
	const stored = await storageHas(key, sync);

	if (!stored) {
		await store(key, value, sync);
	}
}

export async function retrieve<T extends keyof StorageSchema>(
	key: T,
	sync?: boolean
): Promise<StorageSchema[T]> {
	const retrieved =
		sync === false || (sync === undefined && useLocalStorage.has(key))
			? await browser.storage.local.get(key)
			: await browser.storage.sync.get(key);

	const [jsonString] = Object.values(retrieved) as [string];

	try {
		const parsedValue = JSON.parse(jsonString, reviver) as StorageSchema[T];

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
	} catch {
		return jsonString as StorageSchema[T];
	}
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
