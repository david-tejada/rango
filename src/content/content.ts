import browser from "webextension-polyfill";
import { Command } from "../types/types";
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

browser.runtime.onMessage.addListener(async (command: Command) => {
	let action: Command = { type: "ok" };
	switch (command.type) {
		case "getChromiumClipboard": {
			const text = getChromiumClipboard();
			action = {
				type: "clipboardText",
				textCopied: text,
			};
			break;
		}

		case "copyToChromiumClipboard": {
			const text = command.textToCopy;
			copyToChromiumClipboard(text!);
			break;
		}

		case "clickElement": {
			try {
				await clickElement(command.target!, false);
			} catch (error: unknown) {
				console.error(error);
			}

			break;
		}

		case "copyLink": {
			const url = copyLink(command.target!);
			if (url) {
				action = {
					type: "copyToClipboard",
					textToCopy: url,
				};
			}

			break;
		}

		case "showLink":
			showLink(command.target!);
			break;

		case "openInNewTab":
			await clickElement(command.target!, true);
			break;

		case "hoverElement":
			await hoverElement(command.target!, false);
			break;

		case "fixedHoverElement":
			await hoverElement(command.target!, true);
			break;

		case "unhoverAll":
			unhoverAll();
			break;

		case "toggleHints":
			await toggleHints();
			break;

		case "refreshHints":
			await triggerHintsUpdate(true);
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

	return { type: "response", action };
});

let hintsUpdateTimeout: ReturnType<typeof setTimeout>;

document.addEventListener("scroll", async () => {
	clearTimeout(hintsUpdateTimeout);
	hintsUpdateTimeout = setTimeout(triggerHintsUpdate, 300);
});

window.addEventListener("resize", async () => {
	clearTimeout(hintsUpdateTimeout);
	hintsUpdateTimeout = setTimeout(triggerHintsUpdate, 300);
});
