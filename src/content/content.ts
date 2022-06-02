import browser from "webextension-polyfill";
import { ContentRequest, ScriptResponse } from "../typing/types";
import { assertDefined } from "../typing/typing-utils";
import { initOptions } from "../lib/options";
import {
	getChromiumClipboard,
	copyToChromiumClipboard,
} from "./chromium-clipboard";
import {
	increaseHintSize,
	decreaseHintSize,
	toggleHints,
} from "./options-utils";
import { clickElement } from "./click-element";
import { copyLink, showLink } from "./links";
import { hoverElement, unhoverAll } from "./hover";
import { triggerHintsUpdate } from "./hints";
import observe from "./observers";
import { initStack } from "./hints-requests";

// Initialize options
initOptions()
	.then(initStack)
	.then(observe)
	.catch((error) => {
		console.error(error);
	});

browser.runtime.onMessage.addListener(
	async (request: ContentRequest): Promise<ScriptResponse | void> => {
		switch (request.type) {
			// SCRIPT REQUESTS
			case "getChromiumClipboard":
				return { text: getChromiumClipboard() };

			case "copyToChromiumClipboard": {
				const text = request.text;
				assertDefined(text);
				copyToChromiumClipboard(text);
				break;
			}

			// RANGO ACTIONS
			case "clickElement": {
				await clickElement(request.target, false);
				break;
			}

			case "copyLink": {
				const url = copyLink(request.target);
				if (url) {
					return {
						talonAction: {
							type: "copyToClipboard",
							textToCopy: url,
						},
					};
				}

				break;
			}

			case "showLink":
				showLink(request.target);
				break;

			case "openInNewTab":
				await clickElement(request.target, true);
				break;

			case "hoverElement":
				await hoverElement(request.target, false);
				break;

			case "fixedHoverElement":
				await hoverElement(request.target, true);
				break;

			case "unhoverAll":
				unhoverAll();
				break;

			case "toggleHints":
				await toggleHints();
				break;

			case "increaseHintSize":
				await increaseHintSize();
				break;

			case "decreaseHintSize":
				await decreaseHintSize();
				break;

			default:
				break;
		}
	}
);

let hintsUpdateTimeout: ReturnType<typeof setTimeout>;

document.addEventListener("scroll", async () => {
	clearTimeout(hintsUpdateTimeout);
	hintsUpdateTimeout = setTimeout(triggerHintsUpdate, 300);
});

window.addEventListener("resize", async () => {
	clearTimeout(hintsUpdateTimeout);
	hintsUpdateTimeout = setTimeout(triggerHintsUpdate, 300);
});
