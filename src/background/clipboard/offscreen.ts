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
				textarea.select();
				document.execCommand("paste");
				sendResponse(textarea.value);
				return true;
			}
		}

		return false;
	}
);
