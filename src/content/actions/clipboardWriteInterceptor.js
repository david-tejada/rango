const originalDocumentExecCommand = document.execCommand;
const originalClipboardWrite = window.navigator.clipboard.write;
const originalClipboardWriteText = window.navigator.clipboard.writeText;

window.addEventListener("message", (event) => {
	if (event.origin !== window.location.origin) return;

	if (event.data.type === "RANGO_START_CLIPBOARD_WRITE_INTERCEPTION") {
		startClipboardWriteInterception();
	}

	if (event.data.type === "RANGO_STOP_CLIPBOARD_WRITE_INTERCEPTION") {
		stopClipboardWriteInterception();
	}

	if (event.data.type === "RANGO_CHECK_INTERCEPTOR_LOADED") {
		window.postMessage(
			{ type: "RANGO_INTERCEPTOR_LOADED" },
			window.location.origin
		);
	}
});

function startClipboardWriteInterception() {
	window.navigator.clipboard.write = async () => {
		postMessageClipboardWriteIntercepted();
		stopClipboardWriteInterception();
	};

	window.navigator.clipboard.writeText = async (text) => {
		postMessageClipboardWriteIntercepted(text);
		stopClipboardWriteInterception();
	};

	document.execCommand = (...args) => {
		if (args[0] === "copy") {
			postMessageClipboardWriteIntercepted(window.getSelection()?.toString());
			stopClipboardWriteInterception();
			return;
		}

		originalDocumentExecCommand.apply(document, args);
	};

	window.postMessage(
		{ type: "RANGO_CLIPBOARD_WRITE_INTERCEPTION_READY" },
		window.location.origin
	);
}

function stopClipboardWriteInterception() {
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
