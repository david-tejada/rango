import { Mutex } from "async-mutex";
import { sendMessage } from "../messaging/contentMessageBroker";
import {
	addLabelsInFrame,
	clearLabelsInFrame,
	deleteLabelsInFrame,
	getLabelsInFrame,
} from "./labelsInFrame";

const mutex = new Mutex();

export async function initStack() {
	return mutex.runExclusive(async () => {
		clearLabelsInFrame();
		return sendMessage("initStack");
	});
}

export async function synchronizeLabels() {
	await mutex.runExclusive(async () => {
		const labels = getLabelsInFrame();
		if (labels.length > 0) {
			await sendMessage("storeLabelsInFrame", { labels });
		}
	});
}

export async function claimLabels(amount: number) {
	return mutex.runExclusive(async () => {
		const claimed = await sendMessage("claimLabels", { amount });
		addLabelsInFrame(claimed);

		return claimed;
	});
}

export async function reclaimLabelsFromOtherFrames(amount: number) {
	return mutex.runExclusive(async () => {
		const reclaimed = await sendMessage("reclaimLabelsFromOtherFrames", {
			amount,
		});

		addLabelsInFrame(reclaimed);

		return reclaimed;
	});
}

export async function releaseLabels(labels: string[]) {
	await mutex.runExclusive(async () => {
		deleteLabelsInFrame(labels);
		await sendMessage("releaseLabels", { labels });
	});
}

export async function getLabelStackForTab() {
	return sendMessage("getLabelStackForTab");
}
