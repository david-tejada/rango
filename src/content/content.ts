import browser from "webextension-polyfill";
import { initOptions } from "../lib/options";
import {
	increaseHintSize,
	decreaseHintSize,
	toggleHints,
} from "./options-utils";
import { clickElement } from "./click-element";
import { copyLink, showLink } from "./links";
import { hoverElement, unhoverAll } from "./hover";
import { displayHints } from "./hints";
import observe from "./observers";

// Initialize options
initOptions()
	.then(observe)
	.catch((error) => {
		console.error(error);
	});

browser.runtime.onMessage.addListener(async (command) => {
	switch (command.type) {
		case "clickElement":
			await clickElement(command.target, false);
			break;

		case "copyLink": {
			const url = copyLink(command.target);
			if (url) {
				return {
					type: "response",
					action: {
						type: "copyLink",
						target: url,
					},
				};
			}

			break;
		}

		case "showLink":
			showLink(command.target);
			break;

		case "openInNewTab":
			await clickElement(command.target, true);
			break;

		case "hoverElement":
			await hoverElement(command.target, false);
			break;

		case "fixedHoverElement":
			await hoverElement(command.target, true);
			break;

		case "unhoverAll":
			unhoverAll();
			break;

		case "toggleHints":
			await toggleHints();
			break;

		case "refreshHints":
			await displayHints(true);
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

	return { type: "response", action: { type: "ok" } };
});

document.addEventListener("scroll", async () => {
	await displayHints();
});

window.addEventListener("resize", async () => {
	await displayHints();
});
