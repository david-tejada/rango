import browser from "webextension-polyfill";
import { ClipboardResponse } from "../../typings/ScriptResponse";
import {
	RequestFromTalon,
	ResponseToTalon,
	ResponseToTalonVersion0,
} from "../../typings/RequestFromTalon";
import { notify } from "./notify";

let lastRequestText: string | undefined;

async function timer(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

// In order to avoid the pitfalls of creating a copy-paste textarea in the current tab
// with Manifest v3, when possible, we create the textarea in a different tab. This also gives
// us the possibility of executing background commands were content scripts can't run.
// This is useful, for example, to be able to retrieve the current url even if the
// current page doesn't allow content scripts to run, for example, in chrome://extensions/.
async function getClipboardTabId(): Promise<number | undefined> {
	const nonActiveTabs = await browser.tabs.query({ active: false });
	const activeTabsOtherWindows = await browser.tabs.query({
		active: true,
		currentWindow: false,
	});
	const activeTabsCurrentWindow = await browser.tabs.query({
		active: true,
		currentWindow: true,
	});
	const currentTab = activeTabsCurrentWindow[0];
	const possibleClipboardTabsByPriority = [
		...nonActiveTabs,
		...activeTabsOtherWindows,
		...activeTabsCurrentWindow,
	].filter((tab) => tab.url?.startsWith("http"));

	for (const tab of possibleClipboardTabsByPriority) {
		try {
			// If we need to use the active tab for the clipboard area, we need to make sure
			// that the tab status is "complete", otherwise the message to the content script will
			// fail because it won't be loaded. This can happen for example when we click a link
			// an the new page still hasn't loaded when we try to write the response to the clipboard.
			// If in about two seconds the page hasn't completed we continue.
			if (tab === currentTab) {
				let i = 0;
				while (tab.status !== "complete" && i < 40) {
					await timer(50); // eslint-disable-line no-await-in-loop
					i++;
				}
			}

			if (tab.id) {
				// We don't expect a response here, the only thing important is we don't
				// get an error because we weren't able to connect to the content script.
				// eslint-disable-next-line no-await-in-loop
				await browser.tabs.sendMessage(tab.id, {
					message: "Hello, content script!",
				});
				// If we get here it means there wasn't an error connecting to the content script,
				// so we can use this tab for clipboard
				return tab.id;
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				// If there was an error connecting to the content script we try with the next tab
				continue;
			}
		}
	}

	console.error("No tab found for copy-paste area");

	return undefined;
}

async function getClipboardManifestV3(): Promise<string | undefined> {
	const tabId = await getClipboardTabId();
	if (tabId) {
		const { text } = (await browser.tabs.sendMessage(
			tabId,
			{
				type: "getClipboardManifestV3",
			},
			{ frameId: 0 }
		)) as ClipboardResponse;

		return text;
	}

	return undefined;
}

async function copyToClipboardManifestV3(text: string) {
	const tabId = await getClipboardTabId();
	if (tabId) {
		void browser.tabs.sendMessage(
			tabId,
			{
				type: "copyToClipboardManifestV3",
				text,
			},
			{ frameId: 0 }
		);
	}
}

async function getTextFromClipboard(): Promise<string | undefined> {
	if (navigator.clipboard) {
		return navigator.clipboard.readText();
	}

	return getClipboardManifestV3();
}

export async function getRequestFromClipboard(): Promise<
	RequestFromTalon | undefined
> {
	const clipText = await getTextFromClipboard();
	let request: RequestFromTalon;
	if (clipText) {
		try {
			request = JSON.parse(clipText) as RequestFromTalon;
			// This is just to be extra safe
			if (request.type !== "request") {
				console.error(
					'Error: The message present in the clipboard is not of type "request"'
				);
			}

			lastRequestText = clipText;
			return request;
		} catch (error: unknown) {
			// We already check that we are sending valid json in rango-talon, but
			// just to be extra sure
			if (error instanceof SyntaxError) {
				console.error(error);
			}
		}
	} else {
		notify(
			"Error getting the request",
			"Rango was unable to read the request present on the clipboard"
		);
	}

	return undefined;
}

export async function getClipboardIfChanged(): Promise<string | undefined> {
	const clipboardText = await getTextFromClipboard();
	return lastRequestText === clipboardText ? undefined : clipboardText;
}

export async function writeResponseToClipboard(
	response: ResponseToTalon | ResponseToTalonVersion0
) {
	// We send the response so that talon can make sure the request was received
	// and to tell talon to execute any actions
	const jsonResponse = JSON.stringify(response);
	if (navigator.clipboard) {
		return navigator.clipboard.writeText(jsonResponse);
	}

	return copyToClipboardManifestV3(jsonResponse);
}
