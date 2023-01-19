import { getElementCenter } from "./cssomUtils";
import { focusesOnclick } from "./focusesOnclick";

let lastHovered: Element | undefined;

export async function dispatchClick(element: Element) {
	const { x: clientX, y: clientY } = getElementCenter(element);

	const mousedownEvent = new MouseEvent("mousedown", {
		view: window,
		clientX,
		clientY,
		composed: true,
		buttons: 1,
		bubbles: true,
		cancelable: true,
	});

	if (element instanceof HTMLElement && focusesOnclick(element)) {
		element.focus();
	}

	const mouseupEvent = new MouseEvent("mouseup", {
		view: window,
		clientX,
		clientY,
		composed: true,
		bubbles: true,
		cancelable: true,
	});
	const clickEvent = new MouseEvent("click", {
		view: window,
		clientX,
		clientY,
		composed: true,
		bubbles: true,
		cancelable: true,
	});
	element.dispatchEvent(mousedownEvent);
	await new Promise((r) => {
		setTimeout(r, 100);
	});
	element.dispatchEvent(mouseupEvent);
	element.dispatchEvent(clickEvent);
}

export function dispatchHover(element: Element) {
	if (lastHovered) dispatchUnhover(lastHovered);

	const { x: clientX, y: clientY } = getElementCenter(element);

	const mouseenterEvent = new MouseEvent("mouseenter", {
		view: window,
		clientX,
		clientY,
		composed: true,
		buttons: 1,
		bubbles: true,
		cancelable: true,
	});
	const mouseoverEvent = new MouseEvent("mouseover", {
		view: window,
		clientX,
		clientY,
		composed: true,
		bubbles: true,
		cancelable: true,
	});
	const mousemoveEvent = new MouseEvent("mousemove", {
		view: window,
		clientX,
		clientY,
		composed: true,
		bubbles: true,
		cancelable: true,
	});

	element.dispatchEvent(mouseenterEvent);
	element.dispatchEvent(mouseoverEvent);
	element.dispatchEvent(mousemoveEvent);

	lastHovered = element;
}

export function dispatchUnhover(element: Element) {
	const { x: clientX, y: clientY } = getElementCenter(element);

	const mousemoveEvent = new MouseEvent("mousemove", {
		view: window,
		clientX,
		clientY,
		composed: true,
		bubbles: true,
		cancelable: true,
	});

	const mouseleaveEvent = new MouseEvent("mouseleave", {
		view: window,
		clientX,
		clientY,
		composed: true,
		bubbles: true,
		cancelable: true,
	});
	const mouseoutEvent = new MouseEvent("mouseout", {
		view: window,
		clientX,
		clientY,
		composed: true,
		buttons: 1,
		bubbles: true,
		cancelable: true,
	});

	element.dispatchEvent(mousemoveEvent);
	element.dispatchEvent(mouseleaveEvent);
	element.dispatchEvent(mouseoutEvent);

	lastHovered = undefined;
}
