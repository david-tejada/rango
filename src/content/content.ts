import browser from "webextension-polyfill";
import { clickElementByHint } from "./click-element";
import { hoverElementByHint, unhoverAll } from "./hover";
import { toggleHints, displayHints } from "./hints";
import { intersectingElements } from "./intersecting-elements";

browser.runtime.onMessage.addListener(async (request) => {
	if (request.action.type === "clickElementByHint") {
		clickElementByHint(request.action.target);
	}

	if (request.action.type === "hoverElementByHint") {
		hoverElementByHint(request.action.target, false);
	}

	if (request.action.type === "fixedHoverElementByHint") {
		hoverElementByHint(request.action.target, true);
	}

	if (request.action.type === "unhoverAll") {
		unhoverAll();
	}

	if (request.action.type === "toggleHints") {
		toggleHints();
	}
});

document.addEventListener("scroll", () => {
	displayHints(intersectingElements);
});

window.addEventListener("resize", () => {
	displayHints(intersectingElements);
});
