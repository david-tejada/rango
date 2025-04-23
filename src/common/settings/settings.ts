import Emittery from "emittery";
import { isEqual } from "lodash";
import browser from "webextension-polyfill";
import { type Store, store } from "../storage/store";
import { type Settings, settingsSchema } from "./settingsSchema";

type IndexedSettingKey = `${keyof Settings}_${number}`;

const emitter = new Emittery<Settings>();

/**
 * Gets and validates a setting. If the setting is invalid, it will be removed
 * from storage and the default value will be returned.
 */
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

	await store.set(key, validated.data as Store[T]);
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

			const validated = settingsSchema.shape[key].safeParse(updatedValue);
			if (!validated.success) throw new Error(`Validation error for ${key}`);

			return [validated.data as Store[T], result];
		},
		() => settingsSchema.shape[key].parse(undefined) as Store[T]
	);
}

function isValid<T extends keyof Settings>(key: T, value: Settings[T]) {
	return settingsSchema.shape[key].safeParse(value).success;
}

function checkValidity<T extends keyof Settings>(key: T, value: Settings[T]) {
	const parsed = settingsSchema.shape[key].safeParse(value);

	return {
		valid: parsed.success,
		message: parsed.error
			? parsed.error.issues.map((issue) => issue.message).join(" ")
			: undefined,
	};
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

async function upgrade() {
	// Deprecated in favour of hintEnhancedContrast. 2025-03-27
	const hintMinimumContrastRatio = await get("hintMinimumContrastRatio");
	if (hintMinimumContrastRatio >= 7) await set("hintEnhancedContrast", true);
	await remove("hintMinimumContrastRatio");

	// Deprecated in favour of hintFontBold. 2025-03-27
	const hintWeight = await get("hintWeight");
	if (hintWeight === "normal") await set("hintFontBold", false);
	await remove("hintWeight");
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

/**
 * Parses a legacy setting value. Returns `undefined` if the parsing fails.
 */
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

	try {
		return JSON.parse(value, reviver) as unknown;
	} catch {
		return undefined;
	}
}

function isSettingKey(key: string): key is keyof Settings {
	return settingsSchema.keyof().options.includes(key as keyof Settings);
}

function isIndexedSettingKey(key: string): key is IndexedSettingKey {
	const [settingKey, index] = key.split("_");

	if (!settingKey || !index) return false;

	return isSettingKey(settingKey) && !Number.isNaN(Number(index));
}

function getBaseSettingKey(key: keyof Settings | IndexedSettingKey) {
	return key.split("_")[0] as keyof Settings;
}

browser.storage.onChanged.addListener(async (changes) => {
	try {
		const settingChangeEntries = Object.entries(changes).filter(
			([key]) => isSettingKey(key) || isIndexedSettingKey(key)
		) as Array<
			[keyof Settings | IndexedSettingKey, browser.Storage.StorageChange]
		>;

		if (settingChangeEntries.length === 0) return;

		await Promise.all(
			settingChangeEntries.map(async ([key, change]) => {
				if (change && change.oldValue !== change.newValue) {
					const settingKey = getBaseSettingKey(key);
					// We get the value again to ensure it's valid and, in case it was an
					// indexed key value change, we get the actual value of the setting
					const value = await get(settingKey);

					await emitter.emit(settingKey, value);
				}
			})
		);
	} catch (error) {
		console.error(error);
	}
});

export const settings = {
	get,
	getAll,
	set,
	withLock,
	remove,
	isValid,
	checkValidity,
	defaults,
	upgrade,
	onChange: emitter.on.bind(emitter),
	onAnyChange: emitter.onAny.bind(emitter),
};
