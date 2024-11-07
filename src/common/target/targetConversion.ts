import {
	type ElementHintMark,
	type ElementReferenceMark,
	type Mark,
	type Target,
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

	const firstItem = target.items[0];

	if (!firstItem) {
		throw new Error("Target has no items");
	}

	return firstItem.mark.type;
}

export function extractTargetTypeAndValues<T extends Mark>(
	target: Target<T>
): { type: T["type"]; values: string[] } {
	const type = getTargetMarkType(target);

	if (target.type === "primitive") {
		return { type, values: [target.mark.value] };
	}

	return { type, values: target.items.map((item) => item.mark.value) };
}

export function getTargetFromHints(hints: string[]) {
	return arrayToTarget<ElementHintMark>(hints, "elementHint");
}

export function getTargetFromReferences(references: string[]) {
	return arrayToTarget<ElementReferenceMark>(references, "elementReference");
}
