interface OffscreenMessage {
	type: "copy-to-clipboard";
	target: "offscreen-doc";
	text: string;
}

const textarea = document.querySelector("textarea")!;

chrome.runtime.onMessage.addListener((message: OffscreenMessage) => {
	if (message.target !== "offscreen-doc") return;

	switch (message.type) {
		case "copy-to-clipboard":
			textarea.value = message.text;
			textarea.select();
			document.execCommand("copy");
			break;

		default:
			break;
	}
});
