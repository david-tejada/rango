import {
	getBoundingClientRect,
	getCachedStyle,
	getClientDimensions,
} from "../hints/layoutCache";

export function getElementCenter(element: Element) {
	const { x, y, width, height } = element.getBoundingClientRect();
	return { x: x + width / 2, y: y + height / 2 };
}

export function getPaddingRect(element: Element): DOMRect {
	const {
		borderLeftWidth,
		borderRightWidth,
		borderTopWidth,
		borderBottomWidth,
	} = getCachedStyle(element);

	const borderLeft = Number.parseInt(borderLeftWidth, 10);
	const borderRight = Number.parseInt(borderRightWidth, 10);
	const borderTop = Number.parseInt(borderTopWidth, 10);
	const borderBottom = Number.parseInt(borderBottomWidth, 10);

	const { x, y, width, height } = getBoundingClientRect(element);

	return new DOMRect(
		x + borderLeft,
		y + borderTop,
		width - borderLeft - borderRight,
		height - borderTop - borderBottom
	);
}

export function isUserScrollable(element: Element) {
	const { clientWidth, scrollWidth, clientHeight, scrollHeight } =
		getClientDimensions(element);
	const { overflowX, overflowY } = getCachedStyle(element);

	return (
		element === document.documentElement ||
		(scrollWidth > clientWidth && /scroll|auto/.test(overflowX)) ||
		(scrollHeight > clientHeight && /scroll|auto/.test(overflowY))
	);
}
