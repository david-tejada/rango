import { Mutex } from "async-mutex";
import { sendMessage } from "webext-bridge/content-script";
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
		return sendMessage("initStack", undefined, "background");
	});
}

export async function synchronizeHints() {
	await mutex.runExclusive(async () => {
		const hintsInFrame = getHintsInFrame();
		if (hintsInFrame.length > 0) {
			await sendMessage(
				"storeHintsInFrame",
				{ hints: hintsInFrame },
				"background"
			);
		}
	});
}

export async function claimHints(amount: number) {
	return mutex.runExclusive(async () => {
		const claimed = await sendMessage("claimHints", { amount }, "background");
		addHintsInFrame(claimed);

		return claimed;
	});
}

export async function reclaimHintsFromOtherFrames(amount: number) {
	return mutex.runExclusive(async () => {
		const reclaimed = await sendMessage(
			"reclaimHintsFromOtherFrames",
			{ amount },
			"background"
		);

		addHintsInFrame(reclaimed);

		return reclaimed;
	});
}

export async function releaseHints(hints: string[]) {
	await mutex.runExclusive(async () => {
		deleteHintsInFrame(hints);
		await sendMessage("releaseHints", { hints }, "background");
	});
}

export async function getHintsStackForTab() {
	return sendMessage("getHintsStackForTab", undefined, "background");
}
