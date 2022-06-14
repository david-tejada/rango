import browser from "webextension-polyfill";
import {
	ContentRequest,
	ScriptResponse,
	WindowLocationKeys,
} from "../typing/types";
import { initOptions } from "./options/options-utils";
import {
	getClipboardManifestV3,
	copyToClipboardManifestV3,
} from "./utils/manifest-v3-clipboard";
import { clickElement } from "./actions/click-element";
import { openInNewTab, openInBackgroundTab } from "./actions/open-in-new-tab";
import { showLink } from "./actions/show";
import { hoverElement, unhoverAll } from "./actions/hover";
import { triggerHintsUpdate } from "./hints/display-hints";
import observe from "./observers";
import { initStack } from "./hints/hints-requests";
import { NoHintError } from "./classes/errors";
import {
	copyElementTextContentToClipboard,
	copyLinkToClipboard,
	copyMarkdownLinkToClipboard,
	copyToClipboardResponse,
} from "./actions/copy";

// Initialize options
initOptions()
	.then(initStack)
	.then(observe)
	.catch((error) => {
		console.error(error);
	});

browser.runtime.onMessage.addListener(
	async (request: ContentRequest): Promise<ScriptResponse | undefined> => {
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

				// RANGO ACTIONS
				case "clickElement":
				case "directClickElement": {
					await clickElement(request.target);
					break;
				}

				case "copyLink":
					return copyLinkToClipboard(request.target);

				case "copyMarkdownLink":
					return copyMarkdownLinkToClipboard(request.target);

				case "copyElementTextContent":
					return copyElementTextContentToClipboard(request.target);

				case "copyLocationProperty":
					return copyToClipboardResponse(
						window.location[request.target as WindowLocationKeys]
					);

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

				case "refreshHints":
					await triggerHintsUpdate(true);
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

		return undefined;
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
