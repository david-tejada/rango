import browser from "webextension-polyfill";
import { clickElement } from "./click-element";
import { hoverElement, unhoverAll } from "./hover";
import { toggleHints, displayHints } from "./hints";
import { intersectors } from "./intersectors";

browser.runtime.onMessage.addListener(async (request) => {
	if (request.action.type === "clickElement") {
		clickElement(request.action.target, false, {
			bubbles: true,
			cancelable: true,
			view: window,
		});
	}

	if (request.action.type === "openInNewTab") {
		clickElement(request.action.target, true);
	}

	if (request.action.type === "hoverElement") {
		hoverElement(request.action.target, false);
	}

	if (request.action.type === "fixedHoverElement") {
		hoverElement(request.action.target, true);
	}

	if (request.action.type === "unhoverAll") {
		unhoverAll();
	}

	if (request.action.type === "toggleHints") {
		toggleHints();
	}
});

document.addEventListener("scroll", () => {
	displayHints(intersectors);
});

window.addEventListener("resize", () => {
	displayHints(intersectors);
});
