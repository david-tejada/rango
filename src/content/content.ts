import browser from "webextension-polyfill";
// eslint-disable-next-line import/no-unassigned-import
import "requestidlecallback-polyfill";
import { type RequestFromBackground } from "../typings/RequestFromBackground";
import { type TalonAction } from "../typings/RequestFromTalon";
import {
	markHintsAsKeyboardReachable,
	restoreKeyboardReachableHints,
} from "./actions/keyboardClicking";
import { runRangoActionWithTarget } from "./actions/runRangoActionWithTarget";
import { runRangoActionWithoutTarget } from "./actions/runRangoActionWithoutTarget";
import { reclaimHintsFromCache } from "./hints/hintsCache";
import { deleteHintsInFrame } from "./hints/hintsInFrame";
import { synchronizeHints } from "./hints/hintsRequests";
import {
	allowToastNotification,
	notify,
	notifyTogglesStatus,
} from "./notify/notify";
import { updateHintsEnabled } from "./observe";
import { setNavigationToggle } from "./settings/toggles";
import { initContentScriptOrWait } from "./setup/initContentScript";
import {
	getTitleBeforeDecoration,
	initTitleDecoration,
	removeDecorations,
} from "./utils/decorateTitle";
import { updateHintsInTab } from "./utils/getHintsInTab";
import { reclaimHints } from "./wrappers/wrappers";

browser.runtime.onMessage.addListener(
	async (
		message: unknown
	): Promise<
		string | number | string[] | TalonAction[] | boolean | undefined
	> => {
		const request = message as RequestFromBackground;
		await initContentScriptOrWait();

		if ("target" in request) {
			return runRangoActionWithTarget(request);
		}

		try {
			switch (request.type) {
				// SCRIPT REQUESTS
				case "onCompleted": {
					await synchronizeHints();
					break;
				}

				case "displayToastNotification": {
					await notify(request.text, request.options);
					break;
				}

				case "reclaimHints": {
					const reclaimed = reclaimHintsFromCache(request.amount);
					if (reclaimed.length < request.amount) {
						reclaimed.push(...reclaimHints(request.amount - reclaimed.length));
					}

					deleteHintsInFrame(reclaimed);
					return reclaimed;
				}

				case "updateHintsInTab": {
					updateHintsInTab(request.hints);
					break;
				}

				case "markHintsAsKeyboardReachable": {
					markHintsAsKeyboardReachable(request.letter);
					break;
				}

				case "restoreKeyboardReachableHints": {
					restoreKeyboardReachableHints();
					break;
				}

				case "checkIfDocumentHasFocus": {
					return document.hasFocus();
				}

				case "checkContentScriptRunning": {
					return true;
				}

				case "updateNavigationToggle": {
					setNavigationToggle(request.enable);
					await updateHintsEnabled();
					await notifyTogglesStatus();
					break;
				}

				case "allowToastNotification": {
					allowToastNotification();
					break;
				}

				case "tryToFocusPage": {
					window.focus();
					break;
				}

				case "getTitleBeforeDecoration": {
					return getTitleBeforeDecoration();
				}

				case "refreshTitleDecorations": {
					removeDecorations();
					await initTitleDecoration();
					break;
				}

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

(async () => {
	try {
		await initContentScriptOrWait();
	} catch (error: unknown) {
		console.error(error);
	}
})();
