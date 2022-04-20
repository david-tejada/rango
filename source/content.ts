import browser from "webextension-polyfill";
import { clickElementByHint } from "./click-element";
import { hoverElementByHint, unhoverAll } from "./hover";
import { toggleHints } from "./hints";

browser.runtime.onMessage.addListener(async (request) => {
	if (request.action.type === "clickElementByHint") {
		clickElementByHint(request.action.target);
	}

	if (request.action.type === "hoverElementByHint") {
		hoverElementByHint(request.action.target);
	}

	if (request.action.type === "unhoverAll") {
		unhoverAll();
	}

	if (request.action.type === "toggleHints") {
		toggleHints();
	}
});
