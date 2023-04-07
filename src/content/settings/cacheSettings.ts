import { Settings } from "../../common/settings";
import { retrieveSettings } from "../../common/storage";

let cachedSettings: Settings;

// This function must be called when the content script loads
export async function cacheSettings() {
	cachedSettings = await retrieveSettings();
}

export function getCachedSetting<T extends keyof Settings>(key: T) {
	return cachedSettings[key];
}

export function getCachedSettingAll(): Settings {
	return cachedSettings;
}
