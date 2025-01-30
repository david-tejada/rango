import { isEqual } from "lodash";
import { type Store, store } from "../storage/store";
import { type Settings, settingsSchema } from "./settingsSchema";

async function get<T extends keyof Settings>(key: T): Promise<Settings[T]> {
	const value = await store.get(key);
	const validated = settingsSchema.shape[key].safeParse(value);

	if (validated.success) return validated.data as Settings[T];

	return handleInvalidSetting(key, value);
}

async function set<T extends keyof Settings>(key: T, value: Settings[T]) {
	const validated = settingsSchema.shape[key].safeParse(value);

	if (!validated.success) {
		throw new Error(
			`Invalid value for setting ${key}: ${validated.error.message}`
		);
	}

	await store.set(key, value as Store[T]);
}

/**
 * Remove one or more settings.
 *
 * @param keys - The setting key or keys to remove
 */
async function remove<T extends keyof Settings>(keys: T | T[]) {
	await store.remove(keys);
}

/**
 * Executes a callback with exclusive access to a setting.
 *
 * @param key - The setting key to lock
 * @param callback - Function to execute with the locked value. Must return a
 * tuple of [updatedValue, result?]
 *
 * @returns The optional result from the callback, or undefined
 */
async function withLock<T extends keyof Settings, U>(
	key: T,
	callback: (value: Settings[T]) => Promise<[Settings[T], U?]>
): Promise<U> {
	return store.withLock(
		key,
		async (value) => {
			const [updatedValue, result] = await callback(value);
			return [updatedValue as Store[T], result];
		},
		() => settingsSchema.shape[key].parse(undefined) as Store[T]
	);
}

function isValid<T extends keyof Settings>(key: T, value: Settings[T]) {
	return settingsSchema.shape[key].safeParse(value).success;
}

/**
 * Get an object containing all default settings.
 */
function defaults() {
	const keys = settingsSchema.keyof().options;

	return Object.fromEntries(
		keys.map((key) => [key, settingsSchema.shape[key].parse(undefined)])
	) as Settings;
}

/**
 * Get an object containing all settings.
 */
async function getAll(): Promise<Settings> {
	const keys = settingsSchema.keyof().options;

	const entries = await Promise.all(
		keys.map(async (key) => [key, await get(key)])
	);

	return Object.fromEntries(entries) as Settings;
}

async function handleInvalidSetting<T extends keyof Settings>(
	key: T,
	value: unknown
): Promise<Settings[T]> {
	if (typeof value !== "string") return resetSettingToDefault(key);

	const legacyValue = parseLegacySetting(value);
	const revalidated = settingsSchema.shape[key].safeParse(legacyValue);

	if (!revalidated.success) return resetSettingToDefault(key);

	const defaultValue = settingsSchema.shape[key].parse(undefined);
	const isDefault = isEqual(revalidated.data, defaultValue);

	if (isDefault) {
		return resetSettingToDefault(key);
	}

	await store.set(key, revalidated.data as Store[T]);
	return revalidated.data as Settings[T];
}

async function resetSettingToDefault<T extends keyof Settings>(
	key: T
): Promise<Settings[T]> {
	await store.remove(key);
	return settingsSchema.shape[key].parse(undefined) as Settings[T];
}

function parseLegacySetting(value: string) {
	function reviver(_key: string, value: any) {
		if (
			typeof value === "object" &&
			value !== null &&
			value.dataType === "Map" &&
			value.value
		) {
			return Object.fromEntries(
				value.value as Iterable<[unknown, unknown]>
			) as Record<string, unknown>;
		}

		return value as unknown;
	}

	return JSON.parse(value, reviver) as unknown;
}

export const settings = {
	get,
	getAll,
	set,
	withLock,
	remove,
	isValid,
	defaults,
};
