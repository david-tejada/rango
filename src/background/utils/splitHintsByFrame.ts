import { TargetError } from "../../common/target/TargetError";
import { getStack } from "../hints/hintsAllocator";

export async function splitHintsByFrame(tabId: number, hints: string[]) {
	const stack = await getStack(tabId);

	const hintsByFrame = new Map<number, string[]>();

	for (const hint of hints) {
		const frameId = stack.assigned.get(hint);
		if (frameId === undefined) {
			throw new TargetError(`Couldn't find mark "${hint}".`);
		}

		hintsByFrame.set(frameId, [...(hintsByFrame.get(frameId) ?? []), hint]);
	}

	return hintsByFrame;
}
