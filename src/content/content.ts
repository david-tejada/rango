import browser from "webextension-polyfill";
// eslint-disable-next-line import/no-unassigned-import
import "requestidlecallback-polyfill";
import { RequestFromBackground } from "../typings/RequestFromBackground";
import { TalonAction } from "../typings/RequestFromTalon";
import {
	markHintsAsKeyboardReachable,
	restoreKeyboardReachableHints,
} from "./actions/keyboardClicking";
import { updateHintsInTab } from "./utils/getHintsInTab";
import { runRangoActionWithTarget } from "./actions/runRangoActionWithTarget";
import { runRangoActionWithoutTarget } from "./actions/runRangoActionWithoutTarget";
import { getHintStringsInUse, reclaimHints } from "./wrappers/wrappers";
import { reclaimHintsFromCache } from "./hints/hintsCache";
import { notify, notifyTogglesStatus } from "./notify/notify";
import { initContentScript } from "./setup/initContentScript";
import { setNavigationToggle } from "./settings/toggles";
import { updateHintsEnabled } from "./observe";

(async () => {
	await initContentScript();
})();

browser.runtime.onMessage.addListener(
	async (
		request: RequestFromBackground
	): Promise<string | string[] | TalonAction[] | boolean | undefined> => {
		if ("target" in request) {
			return runRangoActionWithTarget(request);
		}

		try {
			switch (request.type) {
				// SCRIPT REQUESTS

				case "displayToastNotification":
					await notify(request.text, request.options);
					break;

				case "getHintStringsInUse":
					return getHintStringsInUse();

				case "reclaimHints": {
					const reclaimed = reclaimHintsFromCache(request.amount);
					if (reclaimed.length < request.amount) {
						reclaimed.push(...reclaimHints(request.amount - reclaimed.length));
					}

					return reclaimed;
				}

				case "updateHintsInTab":
					updateHintsInTab(request.hints);
					break;

				case "markHintsAsKeyboardReachable":
					markHintsAsKeyboardReachable(request.letter);
					break;

				case "restoreKeyboardReachableHints":
					restoreKeyboardReachableHints();
					break;

				case "checkIfDocumentHasFocus":
					return document.hasFocus();

				case "updateNavigationToggle":
					setNavigationToggle(request.enable);
					await updateHintsEnabled();
					await notifyTogglesStatus();
					break;

				default: {
					const result = await runRangoActionWithoutTarget(request);
					return result;
				}
			}
		} catch (error: unknown) {
			console.error(error);
		}

		return undefined;
	}
);
