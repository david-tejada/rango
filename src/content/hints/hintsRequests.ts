import browser from "webextension-polyfill";
import { HintsProvision } from "../../typings/HintsCache";

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

export async function requestHintsProvision(): Promise<HintsProvision> {
	return browser.runtime.sendMessage({
		type: "requestHintsProvision",
	}) as Promise<HintsProvision>;
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
