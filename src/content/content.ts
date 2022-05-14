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
	if (command.type === "clickElement") {
		await clickElement(command.target, false, {
			bubbles: true,
			cancelable: true,
			view: window,
		});
	}

	if (command.type === "copyLink") {
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
	}

	if (command.type === "showLink") {
		showLink(command.target);
	}

	if (command.type === "openInNewTab") {
		await clickElement(command.target, true);
	}

	if (command.type === "hoverElement") {
		await hoverElement(command.target, false);
	}

	if (command.type === "fixedHoverElement") {
		await hoverElement(command.target, true);
	}

	if (command.type === "unhoverAll") {
		unhoverAll();
	}

	if (command.type === "toggleHints") {
		await toggleHints();
	}

	if (command.type === "refreshHints") {
		await displayHints(true);
	}

	if (command.type === "increaseHintSize") {
		await increaseHintSize();
	}

	if (command.type === "decreaseHintSize") {
		await decreaseHintSize();
	}

	return { type: "response", action: { type: "ok" } };
});

document.addEventListener("scroll", async () => {
	await displayHints();
});

window.addEventListener("resize", async () => {
	await displayHints();
});
