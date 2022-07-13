import browser from "webextension-polyfill";
import { Mutex } from "async-mutex";
import { BackgroundRequest } from "../../typings/BackgroundRequest";
import { ContentRequest } from "../../typings/ContentRequest";
import { assertDefined } from "../../typings/TypingUtils";
import {
	initStack,
	claimHints,
	releaseHints,
	releaseOrphanHints,
} from "../utils/hintsAllocator";
import { sendRequestToCurrentTab } from "./sendRequestToCurrentTab";

export async function sendRequestToAllTabs(request: ContentRequest) {
	// We first send the command to the active tabs and then to the rest where it will be
	// executed using window.requestIdleCallback.
	const activeTabs = await browser.tabs.query({
		active: true,
	});

	// We use allSettled here because we want to finish with the active tabs before
	// we move on with the non-active tabs
	await Promise.allSettled(
		activeTabs.map(async (tab) => {
			if (tab.id) {
				return browser.tabs.sendMessage(tab.id, request);
			}
		})
	);

	const nonActiveTabs = await browser.tabs.query({
		active: false,
	});

	const backgroundTabRequest = { ...request };
	backgroundTabRequest.type += "OnIdle";
	await Promise.all(
		nonActiveTabs.map(async (tab) => {
			if (tab.id) {
				return browser.tabs.sendMessage(tab.id, backgroundTabRequest);
			}
		})
	);
}

const mutex = new Mutex();

browser.runtime.onMessage.addListener(
	async (request: BackgroundRequest, sender) => {
		assertDefined(sender.tab);
		const tabId = sender.tab.id;
		assertDefined(tabId);
		const frameId = sender.frameId ?? 0;

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

			case "initStack":
				return mutex.runExclusive(async () => {
					return initStack(tabId, frameId);
				});

			case "claimHints":
				return mutex.runExclusive(async () => {
					return claimHints(request.amount, tabId, frameId);
				});

			case "releaseHints":
				return releaseHints(request.hints, tabId);

			case "releaseOrphanHints":
				return releaseOrphanHints(request.activeHints, tabId, frameId);

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
);
