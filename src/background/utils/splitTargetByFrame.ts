import {
	extractTargetTypeAndValues,
	getTargetFromHints,
	getTargetFromReferences,
} from "../../common/target/targetConversion";
import { TargetError } from "../../common/target/TargetError";
import {
	type ElementMark,
	type ElementReferenceMark,
	type Target,
} from "../../typings/Target/Target";
import { getStack } from "../hints/hintsAllocator";

export async function splitTargetByFrame(
	tabId: number,
	target: Target<ElementMark>
): Promise<Map<number | undefined, Target<ElementMark>>> {
	const { type, values } = extractTargetTypeAndValues(target);

	switch (type) {
		case "elementHint": {
			const stack = await getStack(tabId);
			const hintsByFrame = new Map<number, string[]>();

			for (const hint of values) {
				const frameId = stack.assigned.get(hint);
				if (frameId === undefined) {
					throw new TargetError(`Couldn't find mark "${hint}".`);
				}

				hintsByFrame.set(frameId, [...(hintsByFrame.get(frameId) ?? []), hint]);
			}

			const targetByFrame = new Map<number | undefined, Target<ElementMark>>();

			for (const [frameId, hints] of hintsByFrame) {
				targetByFrame.set(frameId, getTargetFromHints(hints));
			}

			return targetByFrame;
		}

		case "elementReference": {
			const targetByFrame = new Map<
				number | undefined,
				Target<ElementReferenceMark>
			>();

			if (values.length > 0) {
				targetByFrame.set(undefined, getTargetFromReferences(values));
			}

			return targetByFrame;
		}

		case "fuzzyText": {
			throw new Error("Not implemented");
		}
	}
}
