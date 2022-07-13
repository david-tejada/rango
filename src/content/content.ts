import browser from "webextension-polyfill";
import { ScriptResponse } from "../typings/ScriptResponse";
import { ContentRequest } from "../typings/ContentRequest";
import { cacheHintOptions } from "./options/cacheHintOptions";
import {
	getClipboardManifestV3,
	copyToClipboardManifestV3,
} from "./utils/clipboardManifestV3";
import { triggerHintsUpdate } from "./hints/triggerHintsUpdate";
import observe from "./observers";
import { addUrlToTitle } from "./utils/addUrlToTitle";
import {
	markHintsAsKeyboardReachable,
	initKeyboardClicking,
	restoreKeyboardReachableHints,
} from "./actions/keyboardClicking";
import { updateHintsInTab } from "./utils/getHintsInTab";
import { listenToScrollAndResizeEvents } from "./utils/listenToScrollAndResizeEvents";
import { runRangoActionWithTarget } from "./actions/runRangoActionWithTarget";
import { runRangoActionWithoutTarget } from "./actions/runRangoActionWithoutTarget";

cacheHintOptions()
	.then(addUrlToTitle)
	.then(observe)
	.then(listenToScrollAndResizeEvents)
	.then(async () => {
		const { keyboardClicking } = await browser.storage.local.get(
			"keyboardClicking"
		);
		if (keyboardClicking) {
			await initKeyboardClicking();
		}
	})
	.catch((error) => {
		console.error(error);
	});

browser.runtime.onMessage.addListener(
	async (request: ContentRequest): Promise<ScriptResponse | undefined> => {
		if ("target" in request) {
			return runRangoActionWithTarget(request);
		}

		try {
			switch (request.type) {
				// SCRIPT REQUESTS
				case "getClipboardManifestV3":
					return { text: getClipboardManifestV3() };

				case "copyToClipboardManifestV3": {
					const text = request.text;
					copyToClipboardManifestV3(text);
					break;
				}

				case "getLocation":
					return {
						host: window.location.host,
						origin: window.location.origin,
						pathname: window.location.pathname,
					};

				case "updateHintsInTab":
					updateHintsInTab(request.hints);
					break;

				case "markHintsAsKeyboardReachable":
					markHintsAsKeyboardReachable(request.letter);
					break;

				case "restoreKeyboardReachableHints":
					restoreKeyboardReachableHints();
					break;

				case "initKeyboardNavigation":
					await initKeyboardClicking();
					break;

				case "checkIfDocumentHasFocus":
					if (document.hasFocus()) {
						return true;
					}

					// eslint-disable-next-line unicorn/no-useless-promise-resolve-reject, @typescript-eslint/return-await
					return Promise.reject();

				case "fullHintsUpdate":
					await triggerHintsUpdate(true);
					break;

				case "fullHintsUpdateOnIdle":
					window.requestIdleCallback(async () => {
						await triggerHintsUpdate(true);
					});
					break;

				default:
					return await runRangoActionWithoutTarget(request);
			}
		} catch (error: unknown) {
			console.error(error);
		}

		return undefined;
	}
);
