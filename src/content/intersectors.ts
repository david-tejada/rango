import { Intersector } from "../typing/types";
import { getClickableType } from "./utils/clickable-type";
import { NoHintError } from "./classes/errors";

export const intersectors: Intersector[] = [];
export const removedIntersectorsHints: Set<string> = new Set();

function getIntersector(element: Element): Intersector | undefined {
	return intersectors.find((Intersector) => Intersector.element === element);
}

export function getIntersectorWithHint(hint: string): Intersector {
	const intersector = intersectors.find(
		(Intersector) => Intersector.hintText === hint
	);
	if (!intersector) {
		throw new NoHintError("No intersector found with that hint");
	}

	return intersector;
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

	for (const intersector of intersectors) {
		if (intersector.backgroundColor && element.contains(intersector.element)) {
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
