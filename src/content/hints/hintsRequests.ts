import browser from "webextension-polyfill";
import { Mutex } from "async-mutex";
import { type HintsStack } from "../../typings/StorageSchema";
import {
	addHintsInFrame,
	clearHintsInFrame,
	deleteHintsInFrame,
	getHintsInFrame,
} from "./hintsInFrame";

const mutex = new Mutex();

export async function initStack() {
	return mutex.runExclusive(async () => {
		clearHintsInFrame();
		return browser.runtime.sendMessage({
			type: "initStack",
		});
	});
}

export async function synchronizeHints() {
	await mutex.runExclusive(async () => {
		const hintsInFrame = getHintsInFrame();
		if (hintsInFrame.length > 0) {
			await browser.runtime.sendMessage({
				type: "storeHintsInFrame",
				hints: hintsInFrame,
			});
		}
	});
}

export async function claimHints(amount: number) {
	return mutex.runExclusive(async () => {
		const claimed: string[] = await browser.runtime.sendMessage({
			type: "claimHints",
			amount,
		});

		addHintsInFrame(claimed);

		return claimed;
	});
}

export async function reclaimHintsFromOtherFrames(amount: number) {
	return mutex.runExclusive(async () => {
		const reclaimed: string[] = await browser.runtime.sendMessage({
			type: "reclaimHintsFromOtherFrames",
			amount,
		});

		addHintsInFrame(reclaimed);

		return reclaimed;
	});
}

export async function releaseHints(hints: string[]) {
	await mutex.runExclusive(async () => {
		deleteHintsInFrame(hints);

		await browser.runtime.sendMessage({
			type: "releaseHints",
			hints,
		});
	});
}

export async function getHintsStackForTab(): Promise<HintsStack> {
	return browser.runtime.sendMessage({
		type: "getHintsStackForTab",
	});
}
