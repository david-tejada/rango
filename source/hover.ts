import { intersectingElements } from "./intersecting-elements";

export function hoverElementByHint(hintNumber: number) {
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
	}
}

export function unhoverAll() {
	for (const intersectingElement of intersectingElements) {
		const targetElement = intersectingElement.element;
		if (typeof (targetElement as HTMLElement).onmouseout === "object") {
			const event = new MouseEvent("mouseout", {
				view: window,
				bubbles: true,
				cancelable: true,
			});
			targetElement.dispatchEvent(event);
		}
	}
}
