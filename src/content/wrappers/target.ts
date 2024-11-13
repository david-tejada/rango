import {
	getTargetMarkType,
	getTargetValues,
} from "../../common/target/targetConversion";
import { TargetError } from "../../common/target/TargetError";
import { type ElementWrapper } from "../../typings/ElementWrapper";
import { type ElementMark, type Target } from "../../typings/Target/Target";
import { getTextMatchedElement } from "../actions/matchElementByText";
import { getReferences } from "../actions/references";
import { getElementFromSelector } from "../selectors/getElementFromSelector";
import { assertWrappersIntersectViewport } from "./assertIntersectingWrappers";
import { getOrCreateWrapper } from "./ElementWrapperClass";
import { setLastTargetedWrapper } from "./lastTargetedWrapper";
import { getWrapper } from "./wrappers";

export async function getTargetedWrappers(target: Target<ElementMark>) {
	const type = getTargetMarkType(target);

	const wrappers = await getWrappersForTarget(target);

	const lastWrapper = wrappers.at(-1);
	if (lastWrapper) setLastTargetedWrapper(lastWrapper);

	if (type === "elementHint") assertWrappersIntersectViewport(wrappers);

	for (const wrapper of wrappers) wrapper.hint?.flash();

	return wrappers;
}

export async function getFirstWrapper(target: Target<ElementMark>) {
	const wrappers = await getTargetedWrappers(target);

	return wrappers[0]!;
}

async function getWrappersForTarget(target: Target<ElementMark>) {
	const values = getTargetValues(target);
	const type = getTargetMarkType(target);

	switch (type) {
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
			return wrappers.filter(
				(wrapper): wrapper is ElementWrapper => wrapper !== undefined
			);
		}

		case "fuzzyText": {
			return values
				.map((text) => {
					const element = getTextMatchedElement(text);
					if (!element) return undefined;

					return getOrCreateWrapper(element, false);
				})
				.filter((wrapper): wrapper is ElementWrapper => wrapper !== undefined);
		}
	}
}
