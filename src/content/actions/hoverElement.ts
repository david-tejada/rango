import { getElementFromPoint } from "../utils/elementIsVisible";
import { ElementWrapper } from "../wrappers";

const hoveredElements: Set<Element> = new Set();

export async function hoverElement(wrappers: ElementWrapper[]) {
	unhoverAll();
	for (const wrapper of wrappers) {
		wrapper.hint?.flash();
		const targetElement = wrapper.element;
		const targetElementRect = targetElement.getBoundingClientRect();
		const elementToDispatchEvent =
			getElementFromPoint(targetElementRect.x + 5, targetElementRect.y + 5) ??
			targetElement;

		const mouseenterEvent = new MouseEvent("mouseenter", {
			view: window,
			bubbles: true,
			cancelable: true,
		});
		const mouseoverEvent = new MouseEvent("mouseover", {
			view: window,
			bubbles: true,
			cancelable: true,
		});
		elementToDispatchEvent.dispatchEvent(mouseenterEvent);
		elementToDispatchEvent.dispatchEvent(mouseoverEvent);

		hoveredElements.add(targetElement);
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

	hoveredElements.clear();
}
