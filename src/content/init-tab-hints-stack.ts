import browser from "webextension-polyfill";

browser.runtime
	.sendMessage({
		type: "request",
		action: {
			type: "initTabHintsStack",
		},
	})
	.catch((error) => {
		console.error(error);
	});
