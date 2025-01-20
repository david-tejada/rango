import {
	getTargetFromLabels,
	getTargetValues,
} from "../../common/target/targetConversion";
import { TargetError } from "../../common/target/TargetError";
import type { ElementHintMark, Target } from "../../typings/Target/Target";
import { getRequiredStack } from "../hints/labels/labelStack";
import { mapMapValues } from "./utils";

export async function splitElementHintTargetByFrame(
	tabId: number,
	target: Target<ElementHintMark>
) {
	const hints = getTargetValues(target);
	const stack = await getRequiredStack(tabId);

	if (target.type === "range") {
		const anchorFrameId = stack.assigned.get(target.anchor.mark.value);
		if (anchorFrameId === undefined) {
			throw new TargetError(
				`Couldn't find mark "${target.anchor.mark.value}".`
			);
		}

		const activeFrameId = stack.assigned.get(target.active.mark.value);
		if (activeFrameId === undefined) {
			throw new TargetError(
				`Couldn't find mark "${target.active.mark.value}".`
			);
		}

		if (anchorFrameId !== activeFrameId) {
			throw new TargetError(
				`Marks "${target.anchor.mark.value}" and "${target.active.mark.value}" are in different frames.`
			);
		}

		return new Map([[anchorFrameId, target]]);
	}

	const hintsByFrame = new Map<number, string[]>();

	for (const hint of hints) {
		const frameId = stack.assigned.get(hint);
		if (frameId === undefined) {
			throw new TargetError(`Couldn't find mark "${hint}".`);
		}

		hintsByFrame.set(frameId, [...(hintsByFrame.get(frameId) ?? []), hint]);
	}

	return mapMapValues(hintsByFrame, getTargetFromLabels);
}
