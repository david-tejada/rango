import { getIntersectorWithHint } from "../intersectors";
import { triggerHintsUpdate } from "../hints/display-hints";
import { flashHint } from "../hints/styles";
import { isHintedIntersector } from "../../typing/typing-utils";

const hoveredElements: Set<Element> = new Set();

export async function hoverElement(hintText: string) {
	hoveredElements.clear();

	for (const hoveredElement of hoveredElements) {
		unhoverElement(hoveredElement);
	}

	const intersector = getIntersectorWithHint(hintText);
	if (isHintedIntersector(intersector)) {
		flashHint(intersector);
		const targetElement = intersector.element;
		const event = new MouseEvent("mouseover", {
			view: window,
			bubbles: true,
			cancelable: true,
		});

		targetElement.dispatchEvent(event);
		hoveredElements.add(targetElement);
		await triggerHintsUpdate();
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

export function unhoverAll() {
	for (const hoveredElement of hoveredElements) {
		unhoverElement(hoveredElement);
	}
}
