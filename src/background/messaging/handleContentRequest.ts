import { Mutex } from "async-mutex";
import browser from "webextension-polyfill";
import { BackgroundRequest } from "../../typings/BackgroundRequest";
import { assertDefined } from "../../typings/TypingUtils";
import {
	claimHints,
	getStack,
	initStack,
	reclaimHintsFromOtherFrames,
	releaseHints,
} from "../utils/hintsAllocator";
import { sendRequestToCurrentTab } from "./sendRequestToCurrentTab";

const mutex = new Mutex();

export async function handleContentRequest(
	request: BackgroundRequest,
	sender: browser.Runtime.MessageSender
) {
	assertDefined(sender.tab);
	const tabId = sender.tab.id;
	const isActive = sender.tab.active;
	assertDefined(tabId);
	const frameId = sender.frameId ?? 0;

	if (
		[
			"initStack",
			"claimHints",
			"releaseHints",
			"reclaimHintsFromOtherFrames",
			"getHintsStackForTab",
		].includes(request.type)
	) {
		return mutex.runExclusive(async () => {
			switch (request.type) {
				case "initStack":
					return initStack(tabId, frameId);

				case "claimHints":
					return claimHints(request.amount, tabId, frameId);

				case "reclaimHintsFromOtherFrames":
					return reclaimHintsFromOtherFrames(tabId, frameId, request.amount);

				case "releaseHints":
					return releaseHints(request.hints, tabId);

				case "getHintsStackForTab":
					return getStack(tabId);

				default:
					break;
			}
		});
	}

	switch (request.type) {
		case "openInNewTab":
			await browser.tabs.create({
				url: request.url,
			});
			break;

		case "openInBackgroundTab":
			try {
				await Promise.all(
					request.links.map(async (link) =>
						browser.tabs.create({
							url: link,
							active: false,
						})
					)
				);
			} catch (error: unknown) {
				console.error(error);
			}

			break;

		case "getTabId": {
			return { tabId };
		}

		case "clickHintInFrame":
			await sendRequestToCurrentTab({
				type: "clickElement",
				target: [request.hint],
			});
			break;

		case "markHintsAsKeyboardReachable":
			await browser.tabs.sendMessage(tabId, {
				type: "markHintsAsKeyboardReachable",
				letter: request.letter,
			});
			break;

		case "restoreKeyboardReachableHints":
			await browser.tabs.sendMessage(tabId, {
				type: "restoreKeyboardReachableHints",
			});
			break;

		case "tabIsActive":
			return isActive;

		default:
			console.error(request);
			throw new Error("Bad request to background script");
	}

	return undefined;
}
