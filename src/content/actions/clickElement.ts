import { urls } from "../../common/urls";
import { createElement, isEditable } from "../dom/utils";
import { sendMessage } from "../messaging/messageHandler";
import { type ElementWrapper } from "../wrappers/ElementWrapper";

injectClipboardWriteInterceptor();

export async function clickElement(
	wrappers: ElementWrapper[],
	isSingleTarget?: boolean
) {
	if (isSingleTarget && wrappers.length !== 1) {
		throw new Error(
			'"isSingleTarget" can only be true when targeting a single element'
		);
	}

	const anchorWrappers = wrappers.filter(
		(wrapper) => wrapper.element instanceof HTMLAnchorElement
	);
	const nonAnchorWrappers = wrappers.filter(
		(wrapper) => !(wrapper.element instanceof HTMLAnchorElement)
	);

	// ANCHOR ELEMENTS

	// Handle unique anchor element.
	if (wrappers.length === 1 && anchorWrappers.length === 1) {
		await anchorWrappers[0]!.click();
		return undefined;
	}

	// Handle multiple anchor elements.
	if (anchorWrappers.length > 1) {
		await sendMessage("createTabs", {
			createPropertiesArray: anchorWrappers.map((anchorWrapper) => ({
				url: (anchorWrapper.element as HTMLAnchorElement).href,
				active: false,
			})),
		});
	}

	// NON-ANCHOR ELEMENTS

	if (nonAnchorWrappers.length === 0) return undefined;

	if (isSingleTarget) {
		const wrapper = wrappers[0]!;

		const isCopyToClipboardButton = await clickAndDetectClipboardWrite(wrapper);
		const focusPage =
			(isCopyToClipboardButton && !document.hasFocus()) ||
			shouldFocusDocumentOnActivation(wrapper.element);
		const isSelect = wrapper.element.localName === "select";

		return { focusPage, isCopyToClipboardButton, isSelect };
	}

	// Here we don't check if we need to focus the page because it doesn't make
	// sense that the user clicked on more than one things that require focus.
	await Promise.all(nonAnchorWrappers.map(async (wrapper) => wrapper.click()));

	return undefined;
}

/**
 * Returns true if the document needs to be focused in order to be able to
 * interact with the element after activation.
 */
export function shouldFocusDocumentOnActivation(element: Element) {
	if (document.hasFocus()) return false;

	// There's probably more cases but here we just handle the most common ones.
	// In normal usage the document is going to be focused most times anyway.
	if (isEditable(element) || element.localName === "select") return true;

	return false;
}

function injectClipboardWriteInterceptor() {
	const script = createElement("script", {
		id: "rango-clipboard-write-interceptor",
	});
	script.src = urls.clipboardWriteInterceptor.toString();

	document.head.append(script);
}

/**
 * This function clicks an element and returns a promise that resolves to true if
 * a clipboard write operation was detected.
 */
async function clickAndDetectClipboardWrite(wrapper: ElementWrapper) {
	await setUpClipboardWriteInterceptor();
	const clipboardWritePromise = listenForClipboardWrite();
	await wrapper.click();
	return clipboardWritePromise;
}

async function setUpClipboardWriteInterceptor() {
	window.postMessage({ type: "RANGO_ADD_CLIPBOARD_WRITE_INTERCEPTOR" }, origin);

	return new Promise<void>((resolve) => {
		const readyHandler = async (event: MessageEvent) => {
			if (event.origin !== origin) return;

			if (event.data.type === "RANGO_CLIPBOARD_WRITE_INTERCEPTOR_READY") {
				removeEventListener("message", readyHandler);
				resolve();
			}
		};

		addEventListener("message", readyHandler);
	});
}

async function listenForClipboardWrite() {
	const timeoutMs = 50;
	const origin = globalThis.location.origin;

	return new Promise<boolean>((resolve) => {
		const messageHandler = (event: MessageEvent) => {
			if (event.origin !== origin) return;

			if (event.data.type === "RANGO_CLIPBOARD_WRITE_INTERCEPTED") {
				cleanup();
				resolve(true);
			}
		};

		const cleanup = () => {
			window.postMessage(
				{ type: "RANGO_REMOVE_CLIPBOARD_WRITE_INTERCEPTOR" },
				origin
			);
			removeEventListener("message", messageHandler);
		};

		addEventListener("message", messageHandler);

		setTimeout(() => {
			cleanup();
			resolve(false);
		}, timeoutMs);
	});
}
