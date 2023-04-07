import browser from "webextension-polyfill";
import { defaultSettings } from "../../common/settings";
import { hasMatchingKeys } from "../../lib/utils";
import { updateHintsEnabled } from "../observe";
import { refreshHints, updateHintsStyle } from "../wrappers/updateWrappers";
import {
	initKeyboardClicking,
	stopKeyboardClicking,
} from "../actions/keyboardClicking";
import { cacheSettings, getCachedSetting } from "./cacheSettings";

async function handleSettingsChanges(changes: browser.Storage.StorageChange) {
	await cacheSettings();

	const isToggleChange = Object.keys(changes).some((key) =>
		key.startsWith("hintsToggle")
	);

	if (isToggleChange) {
		await updateHintsEnabled();
		return;
	}

	if ("keyboardClicking" in changes) {
		if (getCachedSetting("keyboardClicking")) {
			initKeyboardClicking();
		} else {
			stopKeyboardClicking();
		}

		await refreshHints();
		return;
	}

	if ("includeSingleLetterHints" in changes) {
		await refreshHints();
		return;
	}

	updateHintsStyle();
}

export function watchSettingsChanges() {
	browser.storage.onChanged.addListener(async (changes) => {
		// Most of the time this event fires because we are storing or retrieving
		// hints stacks, so we can directly ignore it here to gain a bit of
		// performance.
		if (Object.keys(changes).includes("hintsStacks")) return;

		if (hasMatchingKeys(defaultSettings, changes)) {
			const isActive = (await browser.runtime.sendMessage({
				type: "tabIsActive",
			})) as boolean;

			if (isActive) {
				await handleSettingsChanges(changes);
			} else {
				window.requestIdleCallback(async () => {
					await handleSettingsChanges(changes);
				});
			}
		}
	});
}
