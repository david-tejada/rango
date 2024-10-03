import browser from "webextension-polyfill";
import { urls } from "../../common/urls";
import {
	type RequestFromTalon,
	type ResponseToTalon,
} from "../../typings/RequestFromTalon";
import { notify } from "./notify";
import { isSafari } from "./isSafari";

/**
 * This is used to make headless testing possible. Because in Chrome for Testing
 * `document.execCommand` doesn't work we need a way to test without using the
 * real clipboard. It reads and writes from and to local storage, that we can
 * then access in our tests.
 */
const storageClipboard = {
	async readText() {
		const { clipboard } = (await browser.storage.local.get("clipboard")) as {
			clipboard: string;
		};
		return clipboard;
	},
	async writeText(text: string) {
		await browser.storage.local.set({
			clipboard: text,
		});
	},
};

async function getClipboardManifestV3(): Promise<string | undefined> {
	try {
		const hasDocument = await chrome.offscreen.hasDocument();
		if (!hasDocument) {
			await chrome.offscreen.createDocument({
				url: urls.offscreenDocument.href,
				reasons: [chrome.offscreen.Reason.CLIPBOARD],
				justification: "Read the request from Talon from the clipboard",
			});
		}

		return await chrome.runtime.sendMessage({
			type: "read-clipboard",
			target: "offscreen-doc",
		});
	} catch (error: unknown) {
		console.error(error);
	}

	return undefined;
}

async function copyToClipboardManifestV3(text: string) {
	try {
		const hasDocument = await chrome.offscreen.hasDocument();
		if (!hasDocument) {
			await chrome.offscreen.createDocument({
				url: urls.offscreenDocument.href,
				reasons: [chrome.offscreen.Reason.CLIPBOARD],
				justification: "Write the response to Talon to the clipboard",
			});
		}

		await chrome.runtime.sendMessage({
			type: "copy-to-clipboard",
			target: "offscreen-doc",
			text,
		});
	} catch (error: unknown) {
		console.error(error);
	}
}

async function getTextFromClipboard(): Promise<string | undefined> {
	if (process.env["NODE_ENV"] === "test") {
		return storageClipboard.readText();
	}

	if (isSafari()) {
		const response: { textFromClipboard: string } =
			await browser.runtime.sendNativeMessage("", {
				request: "getTextFromClipboard",
			});

		return response.textFromClipboard;
	}

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

			return request;
		} catch (error: unknown) {
			// We already check that we are sending valid json in rango-talon, but
			// just to be extra sure
			if (error instanceof SyntaxError) {
				console.error(error);
			}
		}
	} else {
		await notify("Unable to read the request present on the clipboard", {
			type: "error",
		});
	}

	return undefined;
}

export async function writeResponseToClipboard(response: ResponseToTalon) {
	// We send the response so that talon can make sure the request was received
	// and to tell talon to execute any actions

	const jsonResponse = JSON.stringify(response);

	if (process.env["NODE_ENV"] === "test") {
		await storageClipboard.writeText(jsonResponse);
	}

	if (navigator.clipboard) {
		if (isSafari()) {
			const copyPasteArea =
				document.querySelector("#copy-paste-area") ??
				document.createElement("textarea");
			copyPasteArea.id = "copy-paste-area";
			document.body.append(copyPasteArea);
			if (copyPasteArea instanceof HTMLTextAreaElement) {
				copyPasteArea.value = jsonResponse;
				copyPasteArea.select();
				document.execCommand("copy");
				copyPasteArea.value = "";
				return;
			}
		} else {
			return navigator.clipboard.writeText(jsonResponse);
		}
	}

	return copyToClipboardManifestV3(jsonResponse);
}
