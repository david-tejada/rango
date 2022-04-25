import browser from "webextension-polyfill";

browser.commands.onCommand.addListener(async (command: string) => {
	if (command === "get-talon-request") {
		try {
			await readIncomingMessage();
		} catch (error: unknown) {
			let errorMessage = "Error: There was an error";
			if (error instanceof Error) {
				errorMessage = error.message;
			}

			console.log(errorMessage);
		}
	}
});

async function readIncomingMessage() {
	const activeTabs = await browser.tabs.query({
		currentWindow: true,
		active: true,
	});
	const activeTab = activeTabs[0];
	await browser.tabs.sendMessage(activeTab!.id!, {
		text: "read-clipboard-message",
	});
}
