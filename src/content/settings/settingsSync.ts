import Emittery from "emittery";
import { settings } from "../../common/settings/settings";
import { type Settings } from "../../common/settings/settingsSchema";
import { assertDefined } from "../../typings/TypingUtils";

const emitter = new Emittery<Settings>();

const cache = new Map<keyof Settings, Settings[keyof Settings]>();

async function initialize() {
	const allSettings = await settings.getAll();

	for (const [key, value] of Object.entries(allSettings)) {
		cache.set(key as keyof Settings, value);
	}

	settings.onAnyChange(async (key, value) => {
		cache.set(key, value);
		await emitter.emit(key, value);
	});
}

/**
 * Synchronously get the value of a setting. It doesn't read the values from
 * storage but from a cached settings object that updates every time the stored
 * value changes.
 */
function get<T extends keyof Settings>(key: T): Settings[T] {
	const value = cache.get(key);
	assertDefined(value, `Attempting to retrieve setting before initialization.`);

	return value as Settings[T];
}

const onChange = emitter.on.bind(emitter);

export const settingsSync = {
	initialize,
	get,
	onChange,
};
