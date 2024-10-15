import browser from "webextension-polyfill";
import { urls } from "../../common/urls";
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

export async function readClipboard(): Promise<string | undefined> {
	if (process.env["NODE_ENV"] === "test") {
		return storageClipboard.readText();
	}

	if (isSafari()) {
		return readClipboardSafari();
	}

	if (navigator.clipboard) {
		return navigator.clipboard.readText();
	}

	return readClipboardManifestV3();
}

export async function writeClipboard(text: string) {
	if (process.env["NODE_ENV"] === "test") {
		await storageClipboard.writeText(text);
	}

	if (isSafari()) {
		return writeClipboardSafari(text);
	}

	if (navigator.clipboard) {
		return navigator.clipboard.writeText(text);
	}

	return writeClipboardManifestV3(text);
}

async function readClipboardSafari() {
	const response: { textFromClipboard: string } =
		await browser.runtime.sendNativeMessage("", {
			request: "getTextFromClipboard",
		});

	return response.textFromClipboard;
}

async function readClipboardManifestV3(): Promise<string | undefined> {
	const hasDocument = await chrome.offscreen.hasDocument();
	if (!hasDocument) {
		await chrome.offscreen.createDocument({
			url: urls.offscreenDocument.href,
			reasons: [chrome.offscreen.Reason.CLIPBOARD],
			justification: "Read the request from Talon from the clipboard",
		});
	}

	return chrome.runtime.sendMessage({
		type: "read-clipboard",
		target: "offscreen-doc",
	});
}

async function writeClipboardSafari(text: string) {
	const copyPasteArea =
		document.querySelector("#copy-paste-area") ??
		document.createElement("textarea");
	copyPasteArea.id = "copy-paste-area";
	document.body.append(copyPasteArea);
	if (copyPasteArea instanceof HTMLTextAreaElement) {
		copyPasteArea.value = text;
		copyPasteArea.select();
		document.execCommand("copy");
		copyPasteArea.value = "";
	}
}

async function writeClipboardManifestV3(text: string) {
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
}
