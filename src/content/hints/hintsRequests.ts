import browser from "webextension-polyfill";

export async function initStack() {
	return browser.runtime.sendMessage({
		type: "initStack",
	});
}

export async function claimHints(amount: number): Promise<string[]> {
	return browser.runtime.sendMessage({
		type: "claimHints",
		amount,
	}) as Promise<string[]>;
}

export async function releaseHints(hints: string[]) {
	return browser.runtime.sendMessage({
		type: "releaseHints",
		hints,
	});
}

export async function releaseOrphanHints(activeHints: string[]) {
	return browser.runtime.sendMessage({
		type: "releaseOrphanHints",
		activeHints,
	});
}
