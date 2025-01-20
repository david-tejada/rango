import { getBestFuzzyMatch } from "../../common/getBestFuzzyMatch";
import {
	getTargetFromFuzzyTexts,
	getTargetFromLabels,
	getTargetFromReferences,
	getTargetMarkType,
	getTargetValues,
	getViewportOnlyValue,
} from "../../common/target/targetConversion";
import { TargetError } from "../../common/target/TargetError";
import {
	type ElementHintMark,
	type ElementMark,
	type ElementReferenceMark,
	type FuzzyTextElementMark,
	type Target,
} from "../../typings/Target/Target";
import { getRequiredStack } from "../hints/labels/labelStack";
import { sendMessage } from "../messaging/sendMessage";
import { getAllFrames } from "../utils/getAllFrames";
import { promiseAllSettledGrouped } from "../utils/promises";
import { assertReferencesInCurrentTab } from "./references";
import { mapMapValues } from "./utils";

export async function splitTargetByFrame(
	tabId: number,
	target: Target<ElementMark>
): Promise<Map<number, Target<ElementMark>>> {
	const type = getTargetMarkType(target);

	switch (type) {
		case "elementHint": {
			return splitElementHintTargetByFrame(
				tabId,
				target as Target<ElementHintMark>
			);
		}

		case "elementReference": {
			return splitElementReferenceTargetByFrame(
				tabId,
				target as Target<ElementReferenceMark>
			);
		}

		case "fuzzyText": {
			return splitFuzzyTextTargetByFrame(
				tabId,
				target as Target<FuzzyTextElementMark>
			);
		}
	}
}

async function splitElementHintTargetByFrame(
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

async function splitElementReferenceTargetByFrame(
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

async function splitFuzzyTextTargetByFrame(
	tabId: number,
	target: Target<FuzzyTextElementMark>
) {
	const thresholdExcellent = 0.1;

	const texts = getTargetValues(target);
	const viewportOnly = getViewportOnlyValue(target);

	const textsPromise = texts.map(async (text) => {
		// Main Frame: Most of the time we will find the searched element in the
		// main frame. At the same time we need to avoid finding one element with a
		// bad score when there might be an element with a better score in another
		// frame. So if the match is not excellent we will send the message to all
		// frames with a timeout to prevent the slow frames from making the command
		// too slow.
		const mainFrameResult = await sendMessage("matchElementByText", {
			text,
			viewportOnly,
		});
		const mainFrameMatch = { frameId: 0, text, match: mainFrameResult };

		// If we have an excellent hintable match in the main frame (score < 0.1),
		// use it immediately
		if (
			mainFrameResult &&
			mainFrameResult.score < thresholdExcellent &&
			mainFrameResult.isHintable
		) {
			return [mainFrameMatch];
		}

		// If no excellent hintable match in the main frame, send the message to
		// all frames with a time out to prevent the slow frames from making the
		// command too slow.
		const frames = await getAllFrames(tabId);

		const framesPromise = frames
			.filter(({ frameId }) => frameId !== 0)
			.map(async ({ frameId }) => {
				return sendMessage(
					"matchElementByText",
					{
						text,
						viewportOnly,
					},
					{ frameId, maxWait: 300 }
				).then((match) => ({
					frameId,
					text,
					match,
				}));
			});

		const { results } = await promiseAllSettledGrouped(framesPromise);
		return [mainFrameMatch, ...results];
	});

	const { results } = await promiseAllSettledGrouped(textsPromise);
	const allResults = results.flat();

	type FrameMatch = {
		frameId: number;
		text: string;
		match: { score: number; isHintable: boolean };
	};

	// Build an array of the best result for each text. Normally, there will only
	// be one text, but it is possible that there are more if the user says a
	// command like `click text foo and text bar`.
	const bestResults = texts.map((text) => {
		const textResults = allResults
			.filter((r): r is FrameMatch => Boolean(r.match))
			.filter((r) => r.text === text);

		const bestResult = getBestFuzzyMatch(textResults);

		if (!bestResult) {
			throw new Error(`No matching element found for text: "${text}"`);
		}

		return bestResult;
	});

	const fuzzyTextsByFrame = new Map<number, string[]>();
	for (const { frameId, text } of bestResults) {
		fuzzyTextsByFrame.set(frameId, [
			...(fuzzyTextsByFrame.get(frameId) ?? []),
			text,
		]);
	}

	return mapMapValues(fuzzyTextsByFrame, getTargetFromFuzzyTexts);
}
