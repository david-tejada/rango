import browser from "webextension-polyfill";

export async function initTabHintsStack() {
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
}
