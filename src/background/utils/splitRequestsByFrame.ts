import { type RangoActionWithTarget } from "../../typings/RangoAction";
import { withStack } from "../hints/hintsAllocator";

/**
 * Splits one request into several, one for each frame.
 *
 * @param tabId The id of the tab.
 * @param request A RangoActionWithTarget request.
 * @returns Resolves to map of frame numbers and their corresponding requests.
 */
export async function splitRequestsByFrame(
	tabId: number,
	request: RangoActionWithTarget
): Promise<Map<number, RangoActionWithTarget> | undefined> {
	const hints =
		typeof request.target === "string" ? [request.target] : request.target;
	const hintsByFrame = new Map<number, string[]>();
	const requests = new Map<number, any>();

	return withStack(tabId, async (stack) => {
		for (const hint of hints) {
			const hintFrameId = stack.assigned.get(hint);

			if (hintFrameId !== undefined) {
				const hintsInFrame = hintsByFrame.get(hintFrameId);

				if (hintsInFrame) {
					hintsInFrame.push(hint);
				} else {
					hintsByFrame.set(hintFrameId, [hint]);
				}
			}
		}

		for (const [key, value] of hintsByFrame.entries()) {
			const arg = "arg" in request ? request.arg : undefined;

			requests.set(key, {
				type: request.type,
				target: value,
				arg,
			});
		}

		return requests;
	});
}
