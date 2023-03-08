import { setSelectionAtEdge } from "../actions/setSelection";
import { getElementCenter } from "./cssomUtils";
import { focusesOnclick } from "./focusesOnclick";

let lastClicked: Element | undefined;

function mouseEvent(type: string, clientX: number, clientY: number) {
	return new MouseEvent(type, {
		view: window,
		clientX,
		clientY,
		composed: true,
		button: 0,
		buttons: 0,
		bubbles: true,
		cancelable: true,
	});
}

function pointerEvent(type: string, clientX: number, clientY: number) {
	return new PointerEvent(type, {
		pointerId: 1,
		isPrimary: true,
		pointerType: "mouse",
		view: window,
		clientX,
		clientY,
		composed: true,
		button: -1,
		buttons: 0,
		bubbles: true,
		cancelable: true,
	});
}

export function dispatchClick(element: Element): boolean {
	let shouldFocusPage = false;

	if (lastClicked) dispatchUnhover(lastClicked);
	const { x: clientX, y: clientY } = getElementCenter(element);

	element.dispatchEvent(pointerEvent("pointerdown", clientX, clientY));
	element.dispatchEvent(mouseEvent("mousedown", clientX, clientY));

	if (element instanceof HTMLElement && focusesOnclick(element)) {
		window.focus();
		element.focus();
		if (!document.hasFocus()) shouldFocusPage = true;
	}

	element.dispatchEvent(pointerEvent("pointerup", clientX, clientY));
	element.dispatchEvent(mouseEvent("mouseup", clientX, clientY));

	element.dispatchEvent(mouseEvent("click", clientX, clientY));

	lastClicked = element;

	return shouldFocusPage;
}

export function dispatchHover(element: Element) {
	const { x: clientX, y: clientY } = getElementCenter(element);

	element.dispatchEvent(pointerEvent("pointerover", clientX, clientY));
	element.dispatchEvent(pointerEvent("pointerenter", clientX, clientY));
	element.dispatchEvent(pointerEvent("pointermove", clientX, clientY));

	element.dispatchEvent(mouseEvent("mouseover", clientX, clientY));
	element.dispatchEvent(mouseEvent("mouseenter", clientX, clientY));
	element.dispatchEvent(mouseEvent("mousemove", clientX, clientY));
}

export function dispatchUnhover(element: Element) {
	const { x: clientX, y: clientY } = getElementCenter(element);

	element.dispatchEvent(pointerEvent("pointermove", clientX, clientY));
	element.dispatchEvent(mouseEvent("mousemove", clientX, clientY));

	element.dispatchEvent(pointerEvent("pointerout", clientX, clientY));
	element.dispatchEvent(pointerEvent("pointerleave", clientX, clientY));

	element.dispatchEvent(mouseEvent("mouseout", clientX, clientY));
	element.dispatchEvent(mouseEvent("mouseleave", clientX, clientY));
}

export function dispatchKeyDown(element: Element, key: string) {
	const keydownEvent = new KeyboardEvent("keydown", {
		view: window,
		code: key,
		key,
		composed: true,
		bubbles: true,
		cancelable: true,
	});

	element.dispatchEvent(keydownEvent);
}

export function dispatchKeyUp(element: Element, key: string) {
	const keyupEvent = new KeyboardEvent("keyup", {
		view: window,
		code: key,
		key,
		composed: true,
		bubbles: true,
		cancelable: true,
	});

	element.dispatchEvent(keyupEvent);
}
