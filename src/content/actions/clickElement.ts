import { createElement, isEditable } from "../dom/utils";
import { sendMessage } from "../messaging/messageHandler";
import { type ElementWrapper } from "../wrappers/ElementWrapper";

let clipboardWriteInterceptorPath: string;

// For whatever reason, I think related to Parcel, `new URL("...",
// import.meta.url);` doesn't work in Safari in content scripts and throws an
// error `TypeError: "..." cannot be parsed as a URL.` On the other hand,
// getting the path from the background script doesn't work in Chrome. For this
// reason we need to have the two variants. This creates two assets for the same
// file (`clipboardWriteInterceptor.(hash).js`) in Chrome but it looks like it
// uses the right one.
try {
	// This doesn't work in Chrome build in some circumstances. If I put it within
	// `injectClipboardWriteInterceptor` it throws an error. That's why we have it
	// here at the top level.
	clipboardWriteInterceptorPath = new URL(
		"clipboardWriteInterceptor.js",
		import.meta.url
	).href;
	void injectClipboardWriteInterceptor();
} catch {
	sendMessage("getClipboardWriteInterceptorPath")
		.then((path) => {
			clipboardWriteInterceptorPath = path;
			void injectClipboardWriteInterceptor();
		})
		.catch((error: unknown) => {
			console.error(error);
		});
}

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
function shouldFocusDocumentOnActivation(element: Element) {
	if (document.hasFocus()) return false;

	// There's probably more cases but here we just handle the most common ones.
	// In normal usage the document is going to be focused most times anyway.
	if (isEditable(element) || element.localName === "select") return true;

	return false;
}

async function injectClipboardWriteInterceptor() {
	try {
		const script = createElement("script", {
			id: "rango-clipboard-write-interceptor",
			src: clipboardWriteInterceptorPath,
		});

		document.head.append(script);
	} catch (error: unknown) {
		console.error(error);
	}
}

/**
 * This function clicks an element and returns a promise that resolves to true
 * if a clipboard write operation was detected.
 */
async function clickAndDetectClipboardWrite(wrapper: ElementWrapper) {
	// A few elements we know can't be copy to clipboard buttons. Most of the
	// times the elements that copy to the clipboard are buttons, maybe
	// input:button or divs in some rare cases. In any way, we just avoid checking
	// if they are copy to clipboard buttons for the most common elements.
	const notClipboardButtonSelector =
		"input:not([type='button']), textarea, [contenteditable], select, p, h1, h2, h3, h4, h5, h6, li, td, th";

	if (wrapper.element.matches(notClipboardButtonSelector)) {
		await wrapper.click();
		return false;
	}

	try {
		await setUpClipboardWriteInterceptor();
	} catch (error) {
		console.error(error);
		await wrapper.click();
		return false;
	}

	const clipboardWritePromise = listenForClipboardWrite();
	await wrapper.click();
	return clipboardWritePromise;
}

async function setUpClipboardWriteInterceptor() {
	const origin = globalThis.location.origin;

	window.postMessage({ type: "RANGO_ADD_CLIPBOARD_WRITE_INTERCEPTOR" }, origin);

	return new Promise<void>((resolve, reject) => {
		const readyHandler = async (event: MessageEvent) => {
			if (event.origin !== origin) return;

			if (event.data.type === "RANGO_CLIPBOARD_WRITE_INTERCEPTOR_READY") {
				removeEventListener("message", readyHandler);
				clearTimeout(timeout);
				resolve();
			}
		};

		const timeout = setTimeout(() => {
			removeEventListener("message", readyHandler);
			reject(new Error("Unable to set up clipboard write interceptor"));
		}, 50);

		addEventListener("message", readyHandler);
	});
}

async function listenForClipboardWrite() {
	// This can be slow in some cases, depending on the code being executed by
	// the page. Especially, when copying images or other media. I have seen it
	// taking more than 500ms.
	const timeoutMs = 1000;
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
			clearTimeout(timeout);
		};

		addEventListener("message", messageHandler);

		const timeout = setTimeout(() => {
			cleanup();
			resolve(false);
		}, timeoutMs);
	});
}
