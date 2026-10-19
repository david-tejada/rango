type CopyToClipboardMessage = {
	type: "copy-to-clipboard";
	target: "offscreen-doc";
	text: string;
};

type ReadClipboardMessage = {
	type: "read-clipboard";
	target: "offscreen-doc";
};

type OffscreenMessage = CopyToClipboardMessage | ReadClipboardMessage;

const textarea = document.querySelector("textarea")!;

chrome.runtime.onMessage.addListener(
	(message: OffscreenMessage, _, sendResponse) => {
		if (message.target !== "offscreen-doc") return;

		switch (message.type) {
			case "copy-to-clipboard": {
				textarea.value = message.text;
				textarea.select();
				document.execCommand("copy");
				break;
			}

			case "read-clipboard": {
				let text: string | undefined;
				const onPaste = (event: ClipboardEvent) => {
					text = event.clipboardData?.getData("text/plain");
					// Chrome can deliver the request without replacing the textarea,
					// so read the event payload rather than a previous response.
					event.preventDefault();
				};

				textarea.addEventListener("paste", onPaste);
				try {
					textarea.select();
					document.execCommand("paste");
					sendResponse(text);
					return true;
				} finally {
					textarea.removeEventListener("paste", onPaste);
				}
			}
		}

		return false;
	}
);
