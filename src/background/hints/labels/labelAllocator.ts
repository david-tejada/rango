import { store } from "../../../common/storage/store";
import { type LabelStack } from "../../../typings/LabelStack";
import { sendMessage } from "../../messaging/sendMessage";
import { getAllFrames } from "../../utils/getAllFrames";
import { createStack } from "./labelStack";
import { navigationOccurred } from "./webNavigation";

export async function claimLabels(
	tabId: number,
	frameId: number,
	amount: number
): Promise<string[]> {
	return store.withLock(
		`labelStack:${tabId}`,
		async (stack) => {
			if (await navigationOccurred(tabId)) {
				stack = await createStack(tabId);
			}

			if (stack.free.length < reconcileThreshold) {
				await reconcileDeadFrames(tabId, stack);
			}

			const labelsClaimed = stack.free.splice(-amount, amount);
			for (const label of labelsClaimed) {
				stack.assigned[label] = frameId;
			}

			return [stack, labelsClaimed];
		},
		async () => createStack(tabId)
	);
}

/**
 * The number of free labels below which we check whether the labels in use
 * still belong to frames that exist.
 *
 * Reconciling means an extra call to `getAllFrames`, so we only do it once the
 * stack is running low, which is late enough that it costs nothing on a normal
 * page and early enough to recover before we run out.
 */
const reconcileThreshold = 100;

/**
 * Returns to the stack the labels assigned to frames that are no longer in the
 * tab.
 *
 * A frame that is removed from the page takes its labels with it: its content
 * script dies without a chance to release them, and no event tells us it is
 * gone. Pages that rotate ads replace their frames every few seconds, so
 * without this the stack drains for as long as the page is open until there is
 * nothing left to hand out.
 */
async function reconcileDeadFrames(tabId: number, stack: LabelStack) {
	let frames;

	try {
		frames = await getAllFrames(tabId);
	} catch {
		// The tab might be discarded or gone altogether. Not being able to check
		// must never stop us from handing out the labels we do have.
		return;
	}

	const liveFrameIds = new Set(frames.map(({ frameId }) => frameId));

	const stranded = Object.entries(stack.assigned)
		.filter(([, frameId]) => !liveFrameIds.has(frameId))
		.map(([label]) => label);

	if (stranded.length === 0) return;

	for (const label of stranded) {
		delete stack.assigned[label];
	}

	stack.free.push(...stranded);
	stack.free.sort((a, b) => b.length - a.length || b.localeCompare(a));
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
			// eslint-disable-next-line no-await-in-loop
			const reclaimedFromFrame = await sendMessage(
				"reclaimLabels",
				{ amount: amount - reclaimed.length },
				{ tabId, frameId }
			);

			reclaimed.push(...reclaimedFromFrame);

			// Once we have enough labels we don't need to continue sending messages to
			// other frames
			if (reclaimed.length === amount) break;
		}

		for (const label of reclaimed) {
			stack.assigned[label] = frameId;
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
			stack.assigned[label] = frameId;
		}

		return [stack];
	});
}

export async function releaseLabels(tabId: number, labels: string[]) {
	return store.withLock(`labelStack:${tabId}`, async (stack) => {
		// We make sure the labels to release are actually assigned
		const filteredLabels = labels.filter((label) => label in stack.assigned);
		stack.free.push(...filteredLabels);
		stack.free.sort((a, b) => b.length - a.length || b.localeCompare(a));

		for (const label of filteredLabels) {
			delete stack.assigned[label];
		}

		return [stack];
	});
}
