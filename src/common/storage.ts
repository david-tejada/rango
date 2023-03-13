import browser from "webextension-polyfill";
import { Storage } from "../typings/Storage";

const useLocalStorage = new Set([
	"hintsToggleTabs",
	"tabsByRecency",
	"hintsStacks",
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

export async function store<T extends keyof Storage>(
	key: T,
	value: Storage[T],
	sync?: boolean
): Promise<void> {
	const stringified = JSON.stringify(value, replacer);

	await (sync === false || (sync === undefined && useLocalStorage.has(key))
		? browser.storage.local.set({ [key]: stringified })
		: browser.storage.sync.set({ [key]: stringified }));
}

export async function storageHas<T extends keyof Storage>(
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

export async function storeIfUndefined<T extends keyof Storage>(
	key: T,
	value: Storage[T],
	sync?: boolean
): Promise<void> {
	const stored = await storageHas(key, sync);

	if (!stored) {
		await store(key, value, sync);
	}
}

export async function retrieve<T extends keyof Storage>(
	key: T,
	sync?: boolean
): Promise<Storage[T]> {
	const retrieved =
		sync === false || (sync === undefined && useLocalStorage.has(key))
			? await browser.storage.local.get(key)
			: await browser.storage.sync.get(key);

	const [jsonString] = Object.values(retrieved) as [string];

	try {
		return JSON.parse(jsonString, reviver) as Storage[T];
	} catch {
		return jsonString as Storage[T];
	}
}
