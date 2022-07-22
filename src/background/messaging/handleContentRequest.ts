import { Mutex } from "async-mutex";
import browser from "webextension-polyfill";
import { BackgroundRequest } from "../../typings/BackgroundRequest";
import { assertDefined } from "../../typings/TypingUtils";
import {
	claimHints,
	initStack,
	releaseHints,
	releaseOrphanHints,
} from "../utils/hintsAllocator";
import { sendRequestToCurrentTab } from "./sendRequestToCurrentTab";

const mutex = new Mutex();

export async function handleContentRequest(
	request: BackgroundRequest,
	sender: browser.Runtime.MessageSender
) {
	assertDefined(sender.tab);
	const tabId = sender.tab.id;
	assertDefined(tabId);
	const frameId = sender.frameId ?? 0;

	if (
		[
			"initStack",
			"claimHints",
			"requestHintsProvision",
			"releaseHints",
			"releaseOrphanHints",
		].includes(request.type)
	) {
		return mutex.runExclusive(async () => {
			switch (request.type) {
				case "initStack":
					return initStack(tabId, frameId);

				case "claimHints":
					return claimHints(request.amount, tabId, frameId);

				case "requestHintsProvision": {
					const initialAmount = frameId === 0 ? 80 : 40;

					return {
						hints: await claimHints(initialAmount, tabId, frameId),
						initialAmount,
					};
				}

				case "releaseHints":
					return releaseHints(request.hints, tabId);

				case "releaseOrphanHints":
					return releaseOrphanHints(request.activeHints, tabId, frameId);

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

		default:
			throw new Error("Bad request to background script");
	}

	return undefined;
}
