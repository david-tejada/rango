import browser from "webextension-polyfill";
import Emittery from "emittery";
import { defaultSettings, type Settings } from "../../common/settings";
import { retrieve, retrieveSettings } from "../../common/storage";
import { hasMatchingKeys } from "../../lib/utils";
import { assertDefined } from "../../typings/TypingUtils";

// https://github.com/microsoft/TypeScript/issues/51572#issuecomment-1319153323
const entries = Object.entries as <T>(
	object: T
) => Array<[keyof T, T[keyof T]]>;

const emitter = new Emittery<Settings>();

let settingsCache: Settings | undefined;

export async function initSettingsManager() {
	settingsCache = await retrieveSettings();
	browser.storage.onChanged.addListener(async (changes) => {
		// Most of the time this event fires because we are storing or retrieving
		// hints stacks, so we can directly ignore it here to gain a bit of
		// performance.
		if (Object.keys(changes).includes("hintsStacks")) return;

		if (hasMatchingKeys(defaultSettings, changes)) {
			if (document.visibilityState === "visible") {
				await handleSettingChange(changes);
			} else {
				window.requestIdleCallback(async () => {
					await handleSettingChange(changes);
				});
			}
		}
	});
}

function cacheSetting<T extends keyof Settings>(key: T, value: Settings[T]) {
	assertDefined(
		settingsCache,
		"Attempting to set setting before initialization."
	);
	settingsCache[key] = value;
}

/**
 * Synchronously get the value of a setting. It doesn't read the values from
 * storage but from a cached settings object that updates every time the stored
 * value changes.
 */
export function getSetting<T extends keyof Settings>(key: T): Settings[T] {
	assertDefined(
		settingsCache,
		"Attempting to retrieve setting before initialization."
	);
	return settingsCache[key];
}

/**
 * Synchronously get the value for all settings. It doesn't read the values from
 * storage but from a cached settings object that updates every time the stored
 * values change.
 */
export function getAllSettings() {
	assertDefined(
		settingsCache,
		"Attempting to retrieve settings before initialization."
	);
	return settingsCache;
}

async function handleSettingChange(
	changes: Record<keyof Settings, browser.Storage.StorageChange>
) {
	await Promise.all(
		entries(changes).map(async ([key, change]) => {
			if (change && change.oldValue !== change.newValue) {
				// We need to use retrieve here to get the deserialized value.
				const newValue = await retrieve(key);
				cacheSetting(key, newValue);
				await emitter.emit(key, newValue);
			}
		})
	);
}

export const onSettingChange = emitter.on.bind(emitter);
