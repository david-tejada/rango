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
				const event = new MouseEvent("mouseout", {
					view: window,
					bubbles: true,
					cancelable: true,
				});
				targetElement.dispatchEvent(event);
			}, 10_000);
		}
	}
}

export function unhoverAll() {
	for (const intersectingElement of intersectingElements) {
		const targetElement = intersectingElement.element;
		const event = new MouseEvent("mouseout", {
			view: window,
			bubbles: true,
			cancelable: true,
		});
		targetElement.dispatchEvent(event);
	}
}
