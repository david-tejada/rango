import { retrieve } from "../../common/storage";

export async function splitHintsByFrame(tabId: number, hints: string[]) {
	const stacks = await retrieve("hintStacks");
	const stack = stacks.get(tabId);
	if (!stack) throw new Error(`No hint stack found for tab with id ${tabId}`);

	const hintsByFrame = new Map<number, string[]>();

	for (const hint of hints) {
		const hintFrameId = stack.assigned.get(hint);
		if (hintFrameId === undefined) continue;

		const hintsInFrame = hintsByFrame.get(hintFrameId);

		if (hintsInFrame) {
			hintsInFrame.push(hint);
		} else {
			hintsByFrame.set(hintFrameId, [hint]);
		}
	}

	return hintsByFrame;
}
