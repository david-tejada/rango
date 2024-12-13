import {
	getTargetMarkType,
	getTargetValues,
} from "../../common/target/targetConversion";
import { TargetError } from "../../common/target/TargetError";
import {
	type ElementMark,
	type RangeTarget,
	type Target,
} from "../../typings/Target/Target";
import { isDefined } from "../../typings/TypingUtils";
import { getTextMatchedElement } from "../actions/matchElementByText";
import { getReferences } from "../actions/references";
import { getElementFromSelector } from "../dom/getElementFromSelector";
import { getSimilarElementsInRange } from "../dom/getSimilarElementsBetween";
import { assertWrappersIntersectViewport } from "./assertIntersectingWrappers";
import { getOrCreateWrapper } from "./ElementWrapper";
import { setLastTargetedWrapper } from "./lastTargetedWrapper";
import { getWrapper } from "./wrappers";

export async function getTargetedWrappers(target: Target<ElementMark>) {
	const markType = getTargetMarkType(target);

	const wrappers = await getWrappersForTarget(target);

	const lastWrapper = wrappers.at(-1);
	if (lastWrapper) setLastTargetedWrapper(lastWrapper);

	if (markType === "elementHint" && target.type !== "range") {
		assertWrappersIntersectViewport(wrappers);
	}

	for (const wrapper of wrappers) wrapper.hint?.flash();

	return wrappers;
}

export async function getFirstWrapper(target: Target<ElementMark>) {
	const wrappers = await getTargetedWrappers(target);

	return wrappers[0]!;
}

async function getWrappersForTarget(target: Target<ElementMark>) {
	const markType = getTargetMarkType(target);

	if (target.type === "range") {
		if (markType !== "elementHint") {
			throw new Error("Range targets are only supported for element hints.");
		}

		return getRangeWrappers(target).filter((wrapper) => wrapper.isHintable);
	}

	const values = getTargetValues(target);

	switch (markType) {
		case "elementHint": {
			return values.map((hint) => {
				const wrapper = getWrapper(hint);
				if (!wrapper) {
					throw new TargetError(`Couldn't find mark "${hint}".`);
				}

				return wrapper;
			});
		}

		case "elementReference": {
			const wrappers = await Promise.all(
				values.map(async (name) => {
					const { hostReferences } = await getReferences();
					const selector = hostReferences.get(name);
					if (!selector) return;

					const element = await getElementFromSelector(selector);
					return element ? getOrCreateWrapper(element, false) : undefined;
				})
			);
			return wrappers.filter((element) => isDefined(element));
		}

		case "fuzzyText": {
			return values
				.map((text) => {
					const element = getTextMatchedElement(text);
					if (!element) return undefined;

					return getOrCreateWrapper(element, false);
				})
				.filter((element) => isDefined(element));
		}
	}
}

function getRangeWrappers(target: RangeTarget<ElementMark>) {
	const anchor = target.anchor.mark.value;
	const active = target.active.mark.value;

	const anchorWrapper = getWrapper(anchor);
	const activeWrapper = getWrapper(active);

	if (!anchorWrapper?.isIntersectingViewport) {
		throw new TargetError(`Couldn't find mark "${anchor}" in viewport.`);
	}

	if (!activeWrapper?.isIntersectingViewport) {
		throw new TargetError(`Couldn't find mark "${active}" in viewport.`);
	}

	const elements = getSimilarElementsInRange(
		anchorWrapper.element,
		activeWrapper.element
	);

	return elements
		.map((element) => getWrapper(element))
		.filter((element) => isDefined(element));
}
