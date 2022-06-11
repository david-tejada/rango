import browser from "webextension-polyfill";
import { Mutex } from "async-mutex";
import {
	ContentRequest,
	ScriptResponse,
	StorableHintsStack,
	BackgroundRequest,
} from "../typing/types";
import { assertDefined } from "../typing/typing-utils";
import {
	initStack,
	claimHints,
	releaseHints,
	releaseOrphanHints,
} from "./hints-allocator";

async function getActiveTab(): Promise<browser.Tabs.Tab | undefined> {
	const activeTabs = await browser.tabs.query({
		currentWindow: true,
		active: true,
	});

	return activeTabs[0];
}

async function getHintFrameId(
	tabId: number,
	hintText?: string
): Promise<number> {
	const stackName = `hints-stack-${tabId}`;
	const storage = await browser.storage.local.get(stackName);
	const storableStack = storage[stackName] as StorableHintsStack;
	const stack = {
		free: storableStack.free,
		assigned: new Map(storableStack.assigned),
	};

	if (hintText) {
		const hintFrameId = stack.assigned.get(hintText);
		return hintFrameId ? hintFrameId : 0;
	}

	return 0;
}

export async function sendRequestToActiveTab(
	request: ContentRequest
): Promise<ScriptResponse | undefined> {
	const activeTab = await getActiveTab();
	let hintText;
	if ("target" in request) {
		hintText = request.target;
	}

	// We only want to send the request to the frame with the target hint or to the main
	// frame in case that the request doesn't have a hint
	if (activeTab?.id) {
		const frameId = await getHintFrameId(activeTab.id, hintText);
		return browser.tabs.sendMessage(activeTab.id, request, {
			frameId,
		}) as Promise<ScriptResponse | undefined>;
	}

	return undefined;
}

export async function sendRequestToAllTabs(
	request: ContentRequest
): Promise<void> {
	// We first send the command to the active tabs and then to the rest where it will be
	// executed using window.requestIdleCallback.
	// We catch errors here because we know some promises might fail, as the extension
	// is not able to run on all tabs, for example, in pages like "about:debugging".
	const activeTabs = await browser.tabs.query({
		active: true,
	});

	for (const tab of activeTabs) {
		browser.tabs.sendMessage(tab.id!, request).catch((error) => {
			if (
				error.message !==
				"Could not establish connection. Receiving end does not exist."
			) {
				throw new Error(error);
			}
		});
	}

	const rest = await browser.tabs.query({
		active: false,
	});

	for (const tab of rest) {
		const backgroundTabRequest = { ...request };
		backgroundTabRequest.type += "OnIdle";
		void browser.tabs
			.sendMessage(tab.id!, backgroundTabRequest)
			.catch((error) => {
				if (
					error.message !==
					"Could not establish connection. Receiving end does not exist."
				) {
					throw new Error(error);
				}
			});
	}
}

const mutex = new Mutex();

browser.runtime.onMessage.addListener(
	async (request: BackgroundRequest, sender) => {
		const tabId = sender.tab?.id;
		assertDefined(tabId);
		const frameId = sender.frameId ?? 0;

		switch (request.type) {
			case "openInNewTab":
				await browser.tabs.create({
					url: request.url,
				});
				break;

			case "openInBackgroundTab":
				for (const link of request.links) {
					void browser.tabs.create({
						url: link,
						active: false,
					});
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

			case "notify":
				void browser.notifications.create("rango-notification", {
					type: "basic",
					iconUrl: browser.runtime.getURL("../assets/icon128.png"),
					title: request.title,
					message: request.message,
				});
				break;

			default:
				throw new Error("Bad request to background script");
		}

		return undefined;
	}
);
