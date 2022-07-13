import { Intersector, HintedIntersector } from "../typings/Intersector";
import { isHintedIntersector } from "../typings/TypingUtils";
import { getClickableType } from "./utils/getClickableType";
import { getScrollContainer } from "./utils/getScrollContainer";

export const intersectors: Intersector[] = [];
export const removedIntersectorsHints: Set<string> = new Set();

function getIntersector(element: Element): Intersector | undefined {
	return intersectors.find((Intersector) => Intersector.element === element);
}

export function getIntersectorByHint(hint: string): HintedIntersector {
	const intersector = intersectors.find(
		(Intersector) => Intersector.hintText === hint
	);

	if (intersector && isHintedIntersector(intersector)) {
		return intersector;
	}

	throw new Error("No intersector found with that hint");
}

export function getIntersectorsByHints(hints: string[]): HintedIntersector[] {
	return intersectors
		.filter(isHintedIntersector) // eslint-disable-line unicorn/no-array-callback-reference
		.filter((targetIntersector) => hints.includes(targetIntersector.hintText));
}

function removeIntersector(element: Element) {
	const intersectorIndex = intersectors.findIndex(
		(Intersector) => Intersector.element === element
	);
	if (intersectorIndex > -1) {
		const intersector = intersectors[intersectorIndex];
		if (intersector?.hintText) {
			intersector.hintElement?.remove();
			removedIntersectorsHints.add(intersector.hintText);
		}

		intersectors.splice(intersectorIndex, 1);
	}
}

export function onIntersection(
	element: Element,
	isIntersecting: boolean
): void {
	if (isIntersecting) {
		intersectors.push({
			element,
			clickableType: getClickableType(element),
			scrollContainer: getScrollContainer(element),
		});
	} else {
		removeIntersector(element);
	}
}

export function onAttributeMutation(element: Element): boolean {
	const intersector = getIntersector(element);
	let updateHints = false;
	if (intersector) {
		const clickableType = getClickableType(element);

		if (clickableType !== intersector.clickableType) {
			updateHints = true;
		}

		intersector.clickableType = clickableType;
	}

	if (
		element instanceof HTMLInputElement ||
		element instanceof HTMLTextAreaElement ||
		element instanceof HTMLButtonElement ||
		element instanceof HTMLSelectElement
	) {
		const elementLabels = element.labels;
		if (elementLabels) {
			for (const label of elementLabels) {
				const intersector = getIntersector(label);
				if (intersector) {
					intersector.clickableType = getClickableType(label);
				}
			}
		}
	}

	for (const intersector of intersectors) {
		if (
			intersector.backgroundColor &&
			intersector.backgroundColor.hex() !== "#FDA65D" &&
			element.contains(intersector.element)
		) {
			intersector.backgroundColor = undefined;
		}
	}

	for (const descendant of element.querySelectorAll("*")) {
		const observedDescendantElement = getIntersector(descendant);
		if (observedDescendantElement) {
			updateHints = true;
		}
	}

	return updateHints;
}
