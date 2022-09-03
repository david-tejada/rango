import browser from "webextension-polyfill";
import { StorableHintsStack } from "../../typings/HintsStack";
import { RangoActionWithTarget } from "../../typings/RangoAction";

// Splits one request into several if the hints are in different frames.
// Returns a map of frame numbers and their corresponding requests.
export async function splitRequestsByFrame(
	tabId: number,
	request: RangoActionWithTarget
): Promise<Map<number, RangoActionWithTarget> | undefined>;

export async function splitRequestsByFrame(
	tabId: number,
	request: RangoActionWithTarget
): Promise<Map<number, any> | undefined> {
	const hints =
		typeof request.target === "string" ? [request.target] : request.target;
	const hintsByFrame: Map<number, string[]> = new Map();
	const requests: Map<number, any> = new Map();

	const stackName = `hints-stack-${tabId}`;
	const storage = await browser.storage.local.get(stackName);
	const storableStack = storage[stackName] as StorableHintsStack;

	if (!storableStack) {
		return undefined;
	}

	const stack = {
		free: storableStack.free,
		assigned: new Map(storableStack.assigned),
	};

	for (const hint of hints) {
		const hintFrameId = stack.assigned.get(hint);
		if (hintFrameId !== undefined) {
			if (hintsByFrame.has(hintFrameId)) {
				const hintsInFrame = hintsByFrame.get(hintFrameId);
				if (hintsInFrame) {
					hintsInFrame.push(hint);
				}
			} else {
				hintsByFrame.set(hintFrameId, [hint]);
			}
		}
	}

	for (const [key, value] of hintsByFrame.entries()) {
		requests.set(key, {
			type: request.type,
			target: value,
		});
	}

	return requests;
}
