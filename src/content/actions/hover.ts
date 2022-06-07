import { getIntersectorWithHint } from "../intersectors";
import { triggerHintsUpdate } from "../hints/display-hints";

const hoveredElements: Set<Element> = new Set();
const timeoutIds: Set<NodeJS.Timeout> = new Set();

export async function hoverElement(hintText: string, fixed: boolean) {
	hoveredElements.clear();
	for (const timeoutId of timeoutIds) {
		clearTimeout(timeoutId);
	}

	for (const hoveredElement of hoveredElements) {
		unhoverElement(hoveredElement);
	}

	const intersector = getIntersectorWithHint(hintText);
	if (intersector) {
		const targetElement = intersector.element;
		const event = new MouseEvent("mouseover", {
			view: window,
			bubbles: true,
			cancelable: true,
		});

		targetElement.dispatchEvent(event);
		hoveredElements.add(targetElement);
		await triggerHintsUpdate();

		if (!fixed) {
			const timeoutId = setTimeout(() => {
				unhoverElement(targetElement);
			}, 10_000);
			timeoutIds.add(timeoutId);
		}
	}
}

export function unhoverAll() {
	for (const hoveredElement of hoveredElements) {
		unhoverElement(hoveredElement);
	}
}

function unhoverElement(element: Element) {
	const mouseoutEvent = new MouseEvent("mouseout", {
		view: window,
		bubbles: true,
		cancelable: true,
	});
	const mouseleaveEvent = new MouseEvent("mouseleave", {
		view: window,
		bubbles: true,
		cancelable: true,
	});
	element.dispatchEvent(mouseoutEvent);
	element.dispatchEvent(mouseleaveEvent);
}
