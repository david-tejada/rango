import {
	type ElementHintMark,
	type ElementReferenceMark,
	type Mark,
	type Target,
	type TextSearchElementMark,
} from "../../typings/Target/Target";

export function arrayToTarget<T extends Mark>(
	target: string[],
	type: T["type"]
) {
	if (target.length === 1) {
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		return {
			type: "primitive",
			mark: {
				type,
				value: target[0]!,
			},
		} as Target<T>;
	}

	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	return {
		type: "list",
		items: target.map((value) => ({
			type: "primitive",
			mark: {
				type,
				value,
			},
		})),
	} as Target<T>;
}

export function getTargetMarkType<T extends Mark>(
	target: Target<T>
): T["type"] {
	if (target.type === "primitive") {
		return target.mark.type;
	}

	if (target.type === "range") {
		return target.anchor.mark.type;
	}

	const firstItem = target.items[0];

	if (!firstItem) {
		throw new Error("Target has no items");
	}

	return firstItem.mark.type;
}

export function getTargetValues<T extends Mark>(target: Target<T>) {
	if (target.type === "primitive") {
		return [target.mark.value];
	}

	if (target.type === "range") {
		return [target.anchor.mark.value, target.active.mark.value];
	}

	return target.items.map((item) => item.mark.value);
}

/**
 * Returns the `viewportOnly` value of the target.
 *
 * In theory each primitive target could have a different value for
 * viewportOnly. However, we can assume it's always the same for all
 * primitives in the target. We could have `viewportOnly` be another
 * argument and not part of the mark but we would have to have that argument for
 * all commands with target.
 */
export function getViewportOnlyValue<T extends TextSearchElementMark>(
	target: Target<T>
) {
	if (target.type === "primitive") {
		return target.mark.viewportOnly;
	}

	if (target.type === "range") {
		return target.anchor.mark.viewportOnly;
	}

	return target.items[0]!.mark.viewportOnly;
}

export function getTargetFromLabels(labels: string[]) {
	return arrayToTarget<ElementHintMark>(labels, "elementHint");
}

export function getTargetFromReferences(references: string[]) {
	return arrayToTarget<ElementReferenceMark>(references, "elementReference");
}

export function getTargetFromTextSearches(texts: string[]) {
	return arrayToTarget<TextSearchElementMark>(texts, "textSearch");
}
