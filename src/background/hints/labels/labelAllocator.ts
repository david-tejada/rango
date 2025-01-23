import browser from "webextension-polyfill";
import { store } from "../../../common/storage/store";
import { getAllFrames } from "../../utils/getAllFrames";
import { createStack } from "./labelStack";
import { navigationOccurred } from "./webNavigation";

export async function claimLabels(
	tabId: number,
	frameId: number,
	amount: number
): Promise<string[]> {
	return store.withLock(`labelStack:${tabId}`, async (stack) => {
		if (await navigationOccurred(tabId)) {
			stack = await createStack(tabId);
		}

		const labelsClaimed = stack.free.splice(-amount, amount);
		for (const label of labelsClaimed) {
			stack.assigned.set(label, frameId);
		}

		return [stack, labelsClaimed];
	});
}

export async function reclaimLabelsFromOtherFrames(
	tabId: number,
	frameId: number,
	amount: number
) {
	return store.withLock(`labelStack:${tabId}`, async (stack) => {
		const frames = await getAllFrames(tabId);
		const otherFramesIds = frames
			.map((frame) => frame.frameId)
			.filter((id) => id !== frameId);

		const reclaimed: string[] = [];

		for (const frameId of otherFramesIds) {
			// I'm not using our sendMessage to avoid dependency cycle.
			// eslint-disable-next-line no-await-in-loop
			const reclaimedFromFrame: string[] = await browser.tabs.sendMessage(
				tabId,
				{ type: "reclaimLabels", amount: amount - reclaimed.length },
				{ frameId }
			);

			reclaimed.push(...reclaimedFromFrame);

			// Once we have enough labels we don't need to continue sending messages to
			// other frames
			if (reclaimed.length === amount) break;
		}

		for (const label of reclaimed) {
			stack.assigned.set(label, frameId);
		}

		return [stack, reclaimed];
	});
}

// We store labels in use when the content script has been reloaded when the user
// navigated back or forward in history
export async function storeLabelsInFrame(
	tabId: number,
	frameId: number,
	labels: string[]
) {
	return store.withLock(`labelStack:${tabId}`, async (stack) => {
		stack.free = stack.free.filter((value) => !labels.includes(value));

		for (const label of labels) {
			stack.assigned.set(label, frameId);
		}

		return [stack];
	});
}

export async function releaseLabels(tabId: number, labels: string[]) {
	return store.withLock(`labelStack:${tabId}`, async (stack) => {
		// We make sure the labels to release are actually assigned
		const filteredLabels = labels.filter((label) => stack.assigned.has(label));
		stack.free.push(...filteredLabels);
		stack.free.sort((a, b) => b.length - a.length || b.localeCompare(a));

		for (const label of filteredLabels) {
			stack.assigned.delete(label);
		}

		return [stack];
	});
}
