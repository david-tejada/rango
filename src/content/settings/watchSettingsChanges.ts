import browser from "webextension-polyfill";
import { defaultSettings } from "../../common/settings";
import { hasMatchingKeys } from "../../lib/utils";
import { updateHintsEnabled } from "../observe";
import { refreshHints, updateHintsStyle } from "../wrappers/updateWrappers";
import {
	initKeyboardClicking,
	stopKeyboardClicking,
} from "../actions/keyboardClicking";
import { notify, notifyTogglesStatus } from "../notify/notify";
import { initTitleDecoration } from "../utils/decorateTitle";
import { cacheSettings, getCachedSetting } from "./cacheSettings";

async function handleSettingsChanges(
	changes: Record<string, browser.Storage.StorageChange>
) {
	let hasActuallyChanged = false;

	for (const key of Object.keys(changes)) {
		const change = changes[key];
		if (change && change.oldValue !== change.newValue) {
			hasActuallyChanged = true;
		}
	}

	if (!hasActuallyChanged) return;

	await cacheSettings();

	const isToggleChange = Object.keys(changes).some((key) =>
		key.startsWith("hintsToggle")
	);

	if (isToggleChange) {
		await updateHintsEnabled();
		await notifyTogglesStatus();
		return;
	}

	if ("keyboardClicking" in changes) {
		const keyboardClicking = getCachedSetting("keyboardClicking");

		if (keyboardClicking) {
			initKeyboardClicking();
		} else {
			stopKeyboardClicking();
		}

		const status = keyboardClicking ? "enabled" : "disabled";

		await notify(`Keyboard clicking ${status}`, {
			icon: status,
			toastId: "keyboardToggle",
		});

		await refreshHints();
		return;
	}

	if ("includeSingleLetterHints" in changes) {
		await refreshHints();
		return;
	}

	if (
		"urlInTitle" in changes ||
		"includeTabMarkers" in changes ||
		"uppercaseTabMarkers" in changes
	) {
		await initTitleDecoration();
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
			if (document.visibilityState === "visible") {
				await handleSettingsChanges(changes);
			} else {
				window.requestIdleCallback(async () => {
					await handleSettingsChanges(changes);
				});
			}
		}
	});
}
