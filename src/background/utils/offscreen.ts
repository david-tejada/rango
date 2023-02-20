interface OffscreenMessage {
	type: "paste-to-clipboard";
	target: "offscreen-doc";
	text: string;
}

const textarea = document.querySelector("textarea")!;

chrome.runtime.onMessage.addListener((message: OffscreenMessage) => {
	if (message.target !== "offscreen-doc") return;

	switch (message.type) {
		case "paste-to-clipboard":
			textarea.value = message.text;
			textarea.select();
			document.execCommand("copy");
			window.close();
			break;

		default:
			break;
	}
});
