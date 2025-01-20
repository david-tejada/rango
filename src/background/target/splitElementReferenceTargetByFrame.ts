import {
	getTargetFromReferences,
	getTargetValues,
} from "../../common/target/targetConversion";
import type { ElementReferenceMark, Target } from "../../typings/Target/Target";
import { sendMessage } from "../messaging/sendMessage";
import { getAllFrames } from "../utils/getAllFrames";
import { promiseAllSettledGrouped } from "../utils/promises";
import { assertReferencesInCurrentTab } from "./references";
import { mapMapValues } from "./utils";

export async function splitElementReferenceTargetByFrame(
	tabId: number,
	target: Target<ElementReferenceMark>
) {
	const referenceNames = getTargetValues(target);
	await assertReferencesInCurrentTab(referenceNames);

	const frames = await getAllFrames(tabId);

	// We use `Promise.any` to return the first frame that successfully asserts it
	// has an active reference. We do this so that we make sure we only perform an
	// action on a single element, in case the reference is active in multiple
	// frames. Having this here also allows us to throw an appropriate error if no
	// frame has an active reference for the reference name.
	const sending = referenceNames.map(async (referenceName) => {
		return Promise.any(
			frames.map(async ({ frameId }) => {
				return sendMessage(
					"assertActiveReferenceInFrame",
					{ referenceName },
					{ frameId }
				).then(() => ({
					frameId,
					referenceName,
				}));
			})
		);
	});

	const { results } = await promiseAllSettledGrouped(sending);

	if (results.length === 0) {
		throw new Error("Unable to find elements for selected references.");
	}

	const referencesByFrame = new Map<number, string[]>();
	for (const { frameId, referenceName } of results) {
		referencesByFrame.set(frameId, [
			...(referencesByFrame.get(frameId) ?? []),
			referenceName,
		]);
	}

	return mapMapValues(referencesByFrame, getTargetFromReferences);
}
