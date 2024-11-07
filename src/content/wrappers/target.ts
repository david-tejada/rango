import {
	extractTargetTypeAndValues,
	getTargetMarkType,
} from "../../common/target/targetConversion";
import { TargetError } from "../../common/target/TargetError";
import { type ElementWrapper } from "../../typings/ElementWrapper";
import { type ElementMark, type Target } from "../../typings/Target/Target";
import { getReferences } from "../actions/references";
import { getElementFromSelector } from "../actions/runActionOnReference";
import { assertWrappersIntersectViewport } from "./assertIntersectingWrappers";
import { getOrCreateWrapper } from "./ElementWrapperClass";
import { getWrapper } from "./wrappers";

export async function getTargetedWrappers(target: Target<ElementMark>) {
	const type = getTargetMarkType(target);

	const wrappers = await getWrappersForTarget(target);

	if (type === "elementHint") assertWrappersIntersectViewport(wrappers);

	for (const wrapper of wrappers) wrapper.hint?.flash();

	return wrappers;
}

export async function getFirstWrapper(target: Target<ElementMark>) {
	const wrappers = await getTargetedWrappers(target);

	return wrappers[0]!;
}

export async function getWrappersForTarget(target: Target<ElementMark>) {
	const { type, values } = extractTargetTypeAndValues(target);

	if (type === "elementHint") {
		return values.map((hint) => {
			const wrapper = getWrapper(hint);
			if (!wrapper) {
				throw new TargetError(`Couldn't find mark "${hint}".`);
			}

			return wrapper;
		});
	}

	if (type === "elementReference") {
		const wrappers = await Promise.all(
			values.map(async (name) => {
				const { hostReferences } = await getReferences();
				const selector = hostReferences.get(name);
				if (!selector) return;

				const element = await getElementFromSelector(selector, 1000);
				return getOrCreateWrapper(element, false);
			})
		);

		const nonNullWrappers = wrappers.filter(
			(wrapper): wrapper is ElementWrapper => wrapper !== undefined
		);

		for (const wrapper of nonNullWrappers) wrapper.hint?.flash();

		return nonNullWrappers;
	}

	// TODO: Add support for fuzzy text target
	throw new Error("Unsupported target type.");
}
