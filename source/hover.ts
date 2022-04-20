import { intersectingElements } from "./intersecting-elements";
import { displayHints } from "./hints";

export function hoverElementByHint(hintNumber: number, fixed: boolean) {
	const target = intersectingElements.find(
		(intersectingElement) => intersectingElement.hintText === String(hintNumber)
	);
	if (target) {
		const targetElement = target.element;
		const event = new MouseEvent("mouseover", {
			view: window,
			bubbles: true,
			cancelable: true,
		});

		targetElement.dispatchEvent(event);
		displayHints(intersectingElements);

		if (!fixed) {
			setTimeout(() => {
				unhoverElement(targetElement);
			}, 10_000);
		}
	}
}

export function unhoverAll() {
	for (const intersectingElement of intersectingElements) {
		unhoverElement(intersectingElement.element);
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
