import * as browser from "webextension-polyfill";
import { clickElementByText, clickElementByHint } from "./click-element";
import { setHints, displayHints } from "./hints";
import { intersectingVisibleClickableElements } from "./element-lists";

browser.runtime.onMessage.addListener(async (request) => {
	if (request.action.type === "clickElementByText") {
		clickElementByText(request.action.target);
	}

	if (request.action.type === "clickElementByHint") {
		clickElementByHint(request.action.target);
	}

	if (request.action.type === "showAllHints") {
		setHints(Array.from(intersectingVisibleClickableElements));
		displayHints();
	}
});
