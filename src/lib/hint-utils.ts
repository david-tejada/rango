import browser from "webextension-polyfill";

export async function claimHintText(): Promise<string | undefined> {
	return browser.runtime.sendMessage({
		type: "request",
		action: {
			type: "claimHintText",
		},
	}) as Promise<string | undefined>;
}

export async function releaseHintText(letters: string | undefined) {
	if (letters) {
		await browser.runtime.sendMessage({
			type: "request",
			action: {
				type: "releaseHintText",
				target: letters,
			},
		});
	}
}
