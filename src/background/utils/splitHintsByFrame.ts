import { getStack } from "../hints/hintsAllocator";

export async function splitHintsByFrame(tabId: number, hints: string[]) {
	const stack = await getStack(tabId);

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
