import browser from "webextension-polyfill";
import { ContentRequest } from "../typings/ContentRequest";
import { cacheHintOptions } from "./options/cacheHintOptions";
import {
	getClipboardManifestV3,
	copyToClipboardManifestV3,
} from "./utils/clipboardManifestV3";
import observe from "./observe";
import { addUrlToTitle } from "./utils/addUrlToTitle";
import {
	markHintsAsKeyboardReachable,
	initKeyboardClicking,
	restoreKeyboardReachableHints,
} from "./actions/keyboardClicking";
import { updateHintsInTab } from "./utils/getHintsInTab";
import { runRangoActionWithTarget } from "./actions/runRangoActionWithTarget";
import { runRangoActionWithoutTarget } from "./actions/runRangoActionWithoutTarget";

cacheHintOptions()
	.then(addUrlToTitle)
	.then(() => {
		observe();
	})
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
	async (
		request: ContentRequest
	): Promise<string | string[] | boolean | undefined> => {
		if ("target" in request) {
			return runRangoActionWithTarget(request);
		}

		try {
			switch (request.type) {
				// SCRIPT REQUESTS
				case "getClipboardManifestV3":
					return getClipboardManifestV3();

				case "copyToClipboardManifestV3": {
					copyToClipboardManifestV3(request.text);
					break;
				}

				case "getLocation":
					return [
						window.location.host,
						window.location.origin,
						window.location.pathname,
					];

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
