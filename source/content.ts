import browser from "webextension-polyfill";
import { clickElementByHint } from "./click-element";

browser.runtime.onMessage.addListener(async (request) => {
	if (request.action.type === "clickElementByHint") {
		clickElementByHint(request.action.target);
	}
});
