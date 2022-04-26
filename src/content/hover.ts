import { intersectors } from "./intersectors";
import { displayHints } from "./hints";

const hoveredElements: Set<Element> = new Set();
const timeoutIds: Set<NodeJS.Timeout> = new Set();

export function hoverElementByHint(hintText: string, fixed: boolean) {
	hoveredElements.clear();
	for (const timeoutId of timeoutIds) {
		clearTimeout(timeoutId);
	}

	for (const hoveredElement of hoveredElements) {
		unhoverElement(hoveredElement);
	}

	const target = intersectors.find(
		(intersector) => intersector.hintText === hintText
	);
	if (target) {
		const targetElement = target.element;
		const event = new MouseEvent("mouseover", {
			view: window,
			bubbles: true,
			cancelable: true,
		});

		targetElement.dispatchEvent(event);
		hoveredElements.add(targetElement);
		displayHints(intersectors);

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
