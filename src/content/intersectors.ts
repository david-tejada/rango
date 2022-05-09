import { Intersector } from "../types/types";
import { getClickableType, isVisible } from "../lib/dom-utils";
import { releaseHintText } from "../lib/hint-utils";

export const intersectors: Intersector[] = [];

function getIntersector(element: Element): Intersector | undefined {
	return intersectors.find((Intersector) => Intersector.element === element);
}

function removeIntersector(element: Element) {
	const intersectorIndex = intersectors.findIndex(
		(Intersector) => Intersector.element === element
	);
	if (intersectorIndex > -1) {
		const intersector = intersectors[intersectorIndex];
		if (intersector?.hintText) {
			intersector.hintElement?.remove();
			releaseHintText(intersector.hintText).catch((error) => {
				console.error(error);
			});
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
			isVisible: isVisible(element),
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
		const visible = isVisible(element);
		const clickableType = getClickableType(element);

		if (
			visible !== intersector.isVisible ||
			clickableType !== intersector.clickableType
		) {
			updateHints = true;
		}

		intersector.isVisible = visible;
		intersector.clickableType = clickableType;
	}

	for (const descendant of element.querySelectorAll("*")) {
		const observedDescendantElement = getIntersector(descendant);
		if (observedDescendantElement) {
			const visible = isVisible(descendant);
			if (visible !== observedDescendantElement.isVisible) {
				updateHints = true;
			}

			observedDescendantElement.isVisible = visible;
		}
	}

	return updateHints;
}
