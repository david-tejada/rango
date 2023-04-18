import browser from "webextension-polyfill";
import { RequestFromContent } from "../../typings/RequestFromContent";
import { assertDefined } from "../../typings/TypingUtils";
import {
	claimHints,
	initStack,
	reclaimHintsFromOtherFrames,
	releaseHints,
	storeHintsInFrame,
	withStack,
} from "../hints/hintsAllocator";
import { getCurrentTabId } from "../utils/getCurrentTab";
import { sendRequestToContent } from "./sendRequestToContent";

export async function handleRequestFromContent(
	request: RequestFromContent,
	sender: browser.Runtime.MessageSender
) {
	assertDefined(sender.tab);
	const tabId = sender.tab.id;
	const lastFocusedWindow = await browser.windows.getLastFocused();
	const isCurrentTab =
		sender.tab.active && sender.tab.windowId === lastFocusedWindow.id;
	const currentTabId = await getCurrentTabId();
	assertDefined(tabId);
	const frameId = sender.frameId ?? 0;

	switch (request.type) {
		case "initStack":
			// This is to be extra safe as we already make sure we are only sending
			// this request from the main frame of the content script
			if (frameId !== 0) {
				console.warn(
					"Ignoring request to initiate stack that doesn't come from the main frame"
				);
				return;
			}

			return initStack(tabId);

		case "claimHints":
			return claimHints(tabId, frameId, request.amount);

		case "reclaimHintsFromOtherFrames":
			return reclaimHintsFromOtherFrames(tabId, frameId, request.amount);

		case "releaseHints":
			return releaseHints(tabId, request.hints);

		case "storeHintsInFrame":
			return storeHintsInFrame(tabId, frameId, request.hints);

		case "getHintsStackForTab":
			return withStack(tabId, async (stack) => {
				return stack;
			});

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

		case "getContentScriptContext": {
			return { tabId, frameId, currentTabId };
		}

		case "clickHintInFrame":
			await sendRequestToContent({
				type: "clickElement",
				target: [request.hint],
			});
			break;

		case "markHintsAsKeyboardReachable":
			await sendRequestToContent(
				{
					type: "markHintsAsKeyboardReachable",
					letter: request.letter,
				},
				tabId
			);
			break;

		case "restoreKeyboardReachableHints":
			await sendRequestToContent(
				{
					type: "restoreKeyboardReachableHints",
				},
				tabId
			);
			break;

		case "isCurrentTab":
			return isCurrentTab;

		default:
			console.error(request);
			throw new Error("Bad request to background script");
	}

	return undefined;
}
