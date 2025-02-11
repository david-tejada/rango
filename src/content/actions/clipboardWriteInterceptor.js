const originalDocumentExecCommand = document.execCommand;
const originalClipboardWriteText = window.navigator.clipboard.writeText;

window.addEventListener("message", (event) => {
	if (event.origin !== window.location.origin) return;

	if (event.data.type === "RANGO_ADD_CLIPBOARD_WRITE_INTERCEPTOR") {
		addClipboardWriteInterceptor();
	}

	if (event.data.type === "RANGO_REMOVE_CLIPBOARD_WRITE_INTERCEPTOR") {
		removeClipboardWriteInterceptor();
	}
});

function addClipboardWriteInterceptor() {
	window.navigator.clipboard.writeText = async () => {
		postMessageClipboardWriteIntercepted();
		window.navigator.clipboard.writeText = originalClipboardWriteText;
	};

	document.execCommand = (...args) => {
		if (args[0] === "copy") {
			document.execCommand = originalDocumentExecCommand;
			postMessageClipboardWriteIntercepted();
			return;
		}

		originalDocumentExecCommand(...args);
	};

	window.postMessage(
		{ type: "RANGO_CLIPBOARD_WRITE_INTERCEPTOR_READY" },
		window.location.origin
	);
}

function removeClipboardWriteInterceptor() {
	window.navigator.clipboard.writeText = originalClipboardWriteText;
	document.execCommand = originalDocumentExecCommand;
}

function postMessageClipboardWriteIntercepted() {
	window.postMessage(
		{ type: "RANGO_CLIPBOARD_WRITE_INTERCEPTED" },
		window.location.origin
	);
}

document.querySelector("#rango-clipboard-write-interceptor").remove();
