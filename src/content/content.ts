import browser from "webextension-polyfill";
import { ContentRequest, ScriptResponse } from "../typing/types";
import { cacheHintOptions } from "./options/hint-style-options";
import {
	getClipboardManifestV3,
	copyToClipboardManifestV3,
} from "./utils/manifest-v3-clipboard";
import { triggerHintsUpdate } from "./hints/display-hints";
import observe from "./observers";
import { addUrlToTitle } from "./utils/url-in-title";
import {
	markHintsAsKeyboardReachable,
	initKeyboardNavigation,
	restoreKeyboardReachableHints,
} from "./keyboard-clicking";
import { updateHintsInTab } from "./utils/get-hints-in-tab";
import { listenToScrollAndResizeEvents } from "./utils/listen-to-scroll-and-resize-events";
import { runRangoActionWithTarget } from "./actions/run-rango-action-with-target";
import { runRangoActionWithoutTarget } from "./actions/run-rango-action-without-target";

cacheHintOptions()
	.then(addUrlToTitle)
	.then(observe)
	.then(listenToScrollAndResizeEvents)
	.then(async () => {
		const { keyboardClicking } = await browser.storage.local.get(
			"keyboardClicking"
		);
		if (keyboardClicking) {
			await initKeyboardNavigation();
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
					await initKeyboardNavigation();
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
