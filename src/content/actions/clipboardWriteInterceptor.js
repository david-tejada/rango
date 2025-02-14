const originalDocumentExecCommand = document.execCommand;
const originalClipboardWrite = window.navigator.clipboard.write;
const originalClipboardWriteText = window.navigator.clipboard.writeText;

window.addEventListener("message", (event) => {
	if (event.origin !== window.location.origin) return;

	if (event.data.type === "RANGO_ADD_CLIPBOARD_WRITE_INTERCEPTOR") {
		addClipboardWriteInterceptor();
	}

	if (event.data.type === "RANGO_REMOVE_CLIPBOARD_WRITE_INTERCEPTOR") {
		removeClipboardWriteInterceptor();
	}

	if (event.data.type === "RANGO_CHECK_INTERCEPTOR_LOADED") {
		window.postMessage(
			{ type: "RANGO_INTERCEPTOR_LOADED" },
			window.location.origin
		);
	}
});

function addClipboardWriteInterceptor() {
	window.navigator.clipboard.write = async () => {
		postMessageClipboardWriteIntercepted();
		removeClipboardWriteInterceptor();
	};

	window.navigator.clipboard.writeText = async (text) => {
		postMessageClipboardWriteIntercepted(text);
		removeClipboardWriteInterceptor();
	};

	document.execCommand = (...args) => {
		if (args[0] === "copy") {
			postMessageClipboardWriteIntercepted(window.getSelection()?.toString());
			removeClipboardWriteInterceptor();
			return;
		}

		originalDocumentExecCommand.apply(document, args);
	};

	window.postMessage(
		{ type: "RANGO_CLIPBOARD_WRITE_INTERCEPTOR_READY" },
		window.location.origin
	);
}

function removeClipboardWriteInterceptor() {
	document.execCommand = originalDocumentExecCommand;
	window.navigator.clipboard.write = originalClipboardWrite;
	window.navigator.clipboard.writeText = originalClipboardWriteText;
}

function postMessageClipboardWriteIntercepted(text) {
	window.postMessage(
		{ type: "RANGO_CLIPBOARD_WRITE_INTERCEPTED", text },
		window.location.origin
	);
}

document.querySelector("#rango-clipboard-write-interceptor").remove();

window.postMessage(
	{ type: "RANGO_INTERCEPTOR_LOADED" },
	window.location.origin
);
