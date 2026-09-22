import { getLabelCandidates } from "../../../common/underlineLabels";
import { store } from "../../../common/storage/store";
import {
	type ClaimedLabels,
	type LabelRequest,
} from "../../../typings/LabelRequest";
import { type LabelStack } from "../../../typings/LabelStack";
import { sendMessage } from "../../messaging/sendMessage";
import { getAllFrames } from "../../utils/getAllFrames";
import { createStack } from "./labelStack";
import { navigationOccurred } from "./webNavigation";

export async function claimLabels(
	tabId: number,
	frameId: number,
	amount: number,
	requests?: LabelRequest[]
): Promise<ClaimedLabels> {
	return store.withLock(
		`labelStack:${tabId}`,
		async (stack) => {
			if (await navigationOccurred(tabId)) {
				stack = await createStack(tabId);
			}

			if (stack.free.length < reconcileThreshold) {
				await reconcileDeadFrames(tabId, stack);
			}

			const assigned = assignLabelsToText(stack, requests);

			// `amount` is how many labels the frame is short of. A label that
			// matches the text of an element covers one of those, and the frame
			// gives back whatever it ends up holding in excess.
			const remaining = Math.max(amount - Object.keys(assigned).length, 0);
			const unassigned = takeAnyLabels(stack, remaining);

			for (const label of [...Object.values(assigned), ...unassigned]) {
				stack.assigned[label] = frameId;
			}

			return [stack, { assigned, unassigned }];
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
	stack.free.sort(byStackOrder);
}

/**
 * The order the stack is kept in: longest labels first, so that the shorter
 * ones, which are worth more, are the last to be handed out.
 */
function byStackOrder(a: string, b: string) {
	return b.length - a.length || b.localeCompare(a);
}

/**
 * Takes labels for the elements that will show them the usual way, leaving the
 * single letters alone while anything longer is free.
 *
 * A single letter is the only label a short piece of text can spell, so it is
 * worth more to an element that can underline it than to one that will put it
 * in a box either way. They still go out when nothing else is left, which is
 * better than running out of labels altogether.
 */
function takeAnyLabels(stack: LabelStack, amount: number) {
	if (amount <= 0) return [];

	// The stack is kept longest first, so the single letters are the tail of it.
	const firstSingle = stack.free.findIndex((label) => isSingleLetter(label));
	const end = firstSingle === -1 ? stack.free.length : firstSingle;

	const taken = stack.free.splice(Math.max(end - amount, 0), amount);

	if (taken.length < amount) {
		taken.push(...stack.free.splice(-(amount - taken.length)));
	}

	return taken;
}

function isSingleLetter(label: string) {
	return label.length === 1 && label >= "a" && label <= "z";
}

/**
 * Finds, for each request that comes with text, a free label that can be
 * rendered by underlining two contiguous characters of that text. The labels
 * found are removed from `stack.free`.
 *
 * Requests with the fewest labels to choose from are served first. Serving them
 * in the order they come would let an element with plenty of text take a label
 * that is the only option left for a shorter one: a link "API reference" can be
 * labelled a dozen ways, but if it takes "pi" the link "API" next to it is left
 * with a regular hint even though "ap" was free.
 *
 * @returns The labels found, keyed by request id. Requests without text or
 * without any available candidate are absent from the result.
 */
function assignLabelsToText(stack: LabelStack, requests?: LabelRequest[]) {
	const assigned: Record<string, string> = {};
	if (!requests?.length) return assigned;

	const free = new Set(stack.free);

	// How constrained a request is depends on how many of its candidates are
	// actually available, not on how much text it has. The sort is stable, so
	// requests that are equally constrained keep the order they came in, which
	// is the order they appear in the viewport.
	const byFewestOptions = requests
		.filter(({ text }) => text)
		.map(({ id, text, preferredLength }) => ({
			id,
			labels: getLabelCandidates(text!, preferredLength)
				.map(({ label }) => label)
				.filter((label) => free.has(label)),
		}))
		.filter(({ labels }) => labels.length > 0)
		.sort((a, b) => a.labels.length - b.labels.length);

	for (const { id, labels } of byFewestOptions) {
		// Labels taken by an earlier request in this same pass are gone from
		// `free`, so we need to look again rather than trust the list.
		const label = labels.find((label) => free.has(label));

		if (label) {
			assigned[id] = label;
			free.delete(label);
		}
	}

	const claimed = new Set(Object.values(assigned));
	if (claimed.size > 0) {
		stack.free = stack.free.filter((label) => !claimed.has(label));
	}

	return assigned;
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
		stack.free.sort(byStackOrder);

		for (const label of filteredLabels) {
			delete stack.assigned[label];
		}

		return [stack];
	});
}
