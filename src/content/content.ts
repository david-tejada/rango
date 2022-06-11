import browser from "webextension-polyfill";
import { ContentRequest, ScriptResponse } from "../typing/types";
import { initOptions } from "./options/options-utils";
import {
	getChromiumClipboard,
	copyToChromiumClipboard,
} from "./utils/chromium-clipboard";
import { clickElement } from "./actions/click-element";
import { openInNewTab, openInBackgroundTab } from "./actions/open-in-new-tab";
import { copyLink, showLink } from "./actions/show-and-copy-links";
import { hoverElement, unhoverAll } from "./actions/hover";
import { triggerHintsUpdate } from "./hints/display-hints";
import observe from "./observers";
import { initStack } from "./hints/hints-requests";
import { NoHintError } from "./classes/errors";

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
				case "clickElement":
				case "directClickElement": {
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

				case "openInBackgroundTab":
					await openInBackgroundTab(request.target);
					break;

				case "hoverElement":
					await hoverElement(request.target);
					break;

				case "unhoverAll":
					unhoverAll();
					break;

				case "fullHintsUpdate":
					await triggerHintsUpdate(true);
					break;

				case "fullHintsUpdateOnIdle":
					window.requestIdleCallback(async () => {
						await triggerHintsUpdate(true);
					});
					break;

				default:
					break;
			}
		} catch (error: unknown) {
			if (
				request.type === "directClickElement" &&
				error instanceof NoHintError
			) {
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
