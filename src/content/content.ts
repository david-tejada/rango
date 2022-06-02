import browser from "webextension-polyfill";
import { ContentRequest, ScriptResponse } from "../typing/types";
import { initOptions } from "./options";
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
import { openInNewTab } from "./open-in-new-tab";
import { copyLink, showLink } from "./links";
import { hoverElement, unhoverAll } from "./hover";
import { triggerHintsUpdate } from "./hints";
import observe from "./observers";
import { initStack } from "./hints-requests";
import { NoHintError } from "./classes";

// Initialize options
initOptions()
	.then(initStack)
	.then(observe)
	.catch((error) => {
		console.error(error);
	});

browser.runtime.onMessage.addListener(
	async (request: ContentRequest): Promise<ScriptResponse> => {
		try {
			switch (request.type) {
				// SCRIPT REQUESTS
				case "getChromiumClipboard":
					return { text: getChromiumClipboard() };

				case "copyToChromiumClipboard": {
					const text = request.text;
					copyToChromiumClipboard(text);
					break;
				}

				// RANGO ACTIONS
				case "clickElement": {
					await clickElement(request.target);
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
					await openInNewTab(request.target);
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
		} catch (error: unknown) {
			if (error instanceof NoHintError) {
				return {
					talonAction: {
						type: "noHintFound",
					},
				};
			}

			console.error(error);
		}

		return {};
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
