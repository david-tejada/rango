import { RangoActionWithTarget } from "../../typings/RangoAction";
import { withStack } from "../hints/hintsAllocator";

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

	return withStack(tabId, async (stack) => {
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
			let arg: number | string | undefined;

			if (
				request.type === "scrollUpAtElement" ||
				request.type === "scrollDownAtElement" ||
				request.type === "scrollLeftAtElement" ||
				request.type === "scrollRightAtElement" ||
				request.type === "insertToField"
			) {
				arg = request.arg;
			}

			requests.set(key, {
				type: request.type,
				target: value,
				arg,
			});
		}

		return requests;
	});
}
