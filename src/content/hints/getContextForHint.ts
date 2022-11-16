/* eslint-disable max-depth */
import { getFirstCharacterRect } from "../utils/nodeUtils";

// We can't place hints inside self closing elements
function isSelfClosing(element: Element) {
	// prettier-ignore
	const selfClosingTags = [ "area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr", ];
	return selfClosingTags.includes(element.tagName.toLowerCase());
}

function getPaddingRect(element: Element): DOMRect {
	const {
		borderLeftWidth,
		borderRightWidth,
		borderTopWidth,
		borderBottomWidth,
	} = window.getComputedStyle(element);

	const borderLeft = Number.parseInt(borderLeftWidth, 10);
	const borderRight = Number.parseInt(borderRightWidth, 10);
	const borderTop = Number.parseInt(borderTopWidth, 10);
	const borderBottom = Number.parseInt(borderBottomWidth, 10);

	const { x, y, width, height } = element.getBoundingClientRect();

	return new DOMRect(
		x + borderLeft,
		y + borderTop,
		width - borderLeft - borderRight,
		height - borderTop - borderBottom
	);
}

interface HintContext {
	container: Element;
	outermostPossibleContainer: Element;
	makeHintRelative: boolean;
	availableSpaceLeft?: number;
	availableSpaceTop?: number;
}

export function getContextForHint(
	element: Element,
	elementToPositionHint: Element | SVGElement | Text
): HintContext {
	let container: Element | undefined;

	const targetRect =
		elementToPositionHint instanceof Text
			? getFirstCharacterRect(elementToPositionHint)
			: elementToPositionHint.getBoundingClientRect();

	// If the space left and top exceeds these amounts there's no need to keep
	// calculating the available space
	const baselineLeft = 15;
	const baselineTop = 10;

	// This is the element that we are currently checking if it has sufficient
	// space around so that the hint isn't hidden
	let candidate: Element | undefined;

	let current = isSelfClosing(element) ? element.parentElement : element;

	let goneThroughPositioned = false;

	while (current) {
		// We can't place the hint for the <summary> element inside of the <details>
		// element because it will be hidden
		if (
			current instanceof HTMLDetailsElement &&
			element.tagName === "SUMMARY"
		) {
			current = current.parentElement;
			continue;
		}

		const currentStyle = window.getComputedStyle(current);

		if (currentStyle.position !== "static") {
			goneThroughPositioned = true;
		}

		if (currentStyle.display === "contents") {
			current = current.parentElement;
			continue;
		}

		const hasTransform =
			currentStyle.transform !== "none" ||
			currentStyle.willChange === "transform";

		if (
			!candidate &&
			(!(currentStyle.display === "inline") || hasTransform) &&
			currentStyle.opacity === "1"
		) {
			candidate = current;
		}

		if (candidate) {
			const paddingRect = getPaddingRect(current);
			const currentRect = current.getBoundingClientRect();

			// I might have to deal for when current is pushed out of the viewport (no scrolling)
			if (
				targetRect.x - paddingRect.x >= baselineLeft &&
				targetRect.y - paddingRect.y >= baselineTop &&
				!container
			) {
				container = candidate;
			}

			const isUserScrollable =
				current === document.documentElement ||
				(current.scrollWidth > current.clientWidth &&
					/scroll|auto/.test(currentStyle.overflowX)) ||
				(current.scrollHeight > current.clientHeight &&
					/scroll|auto/.test(currentStyle.overflowY));

			// If the current element is a scroll container or position fixed or sticky
			// we can't go beyond as we need the hint to stay within those elements.
			if (
				isUserScrollable ||
				currentStyle.position === "fixed" ||
				currentStyle.position === "sticky" ||
				hasTransform
			) {
				if (container) {
					return {
						container,
						outermostPossibleContainer: current,
						makeHintRelative: !goneThroughPositioned && !hasTransform,
					};
				}

				const candidateOverflow = window.getComputedStyle(candidate).overflow;

				// If we get here the candidate doesn't have enough space to place the hint
				container = /hidden|clip|scroll|auto/.test(candidateOverflow)
					? current
					: candidate;

				if (isUserScrollable) {
					// We do Math.max to handle hidden elements that are unreachable
					const availableSpaceLeft = Math.max(
						current.scrollLeft - (currentRect.x - targetRect.x),
						0
					);
					const availableSpaceTop = Math.max(
						current.scrollTop - (currentRect.y - targetRect.y),
						0
					);

					return {
						container,
						outermostPossibleContainer: current,
						makeHintRelative: !goneThroughPositioned,
						availableSpaceLeft,
						availableSpaceTop,
					};
				}

				if (currentStyle.position === "fixed") {
					let availableSpaceLeft;
					let availableSpaceTop;

					if (currentStyle.overflow === "visible") {
						availableSpaceLeft = targetRect.x;
						availableSpaceTop = targetRect.y;
					}

					if (/hidden|clip/.test(currentStyle.overflow)) {
						availableSpaceLeft = currentRect.x - targetRect.x;
						availableSpaceTop = currentRect.y - targetRect.y;
					}

					if (/scroll|auto/.test(currentStyle.overflow)) {
						availableSpaceLeft =
							current.scrollLeft - (currentRect.x - targetRect.x);
						availableSpaceTop =
							current.scrollTop - (currentRect.y - targetRect.y);
					}

					return {
						container,
						outermostPossibleContainer: current,
						makeHintRelative: !goneThroughPositioned,

						// There is a possibility that these values are wrong if the fixed
						// positioning containing block is not the viewport, although it's a
						// rare case and I don't think it's worth it to worry too much about it
						availableSpaceLeft,
						availableSpaceTop,
					};
				}

				if (currentStyle.position === "sticky") {
					const innerX = targetRect.x - currentRect.x;
					const innerY = targetRect.y - currentRect.y;

					let availableSpaceLeft;
					let availableSpaceTop;

					if (/hidden|clip/.test(currentStyle.overflow)) {
						availableSpaceLeft = innerX;
						availableSpaceTop = innerY;
					}

					if (/scroll|auto/.test(currentStyle.overflow)) {
						availableSpaceLeft =
							current.scrollLeft - (currentRect.x - targetRect.x);
						availableSpaceTop =
							current.scrollTop - (currentRect.y - targetRect.y);
					}

					if (currentStyle.overflow === "visible") {
						const stickyLeft = Number.parseInt(currentStyle.left, 10);
						const stickyTop = Number.parseInt(currentStyle.top, 10);

						availableSpaceLeft = Number.isNaN(stickyLeft)
							? innerX
							: stickyLeft + innerX;
						availableSpaceTop = Number.isNaN(stickyTop)
							? innerY
							: stickyTop + innerY;
					}

					return {
						container,
						outermostPossibleContainer: current,
						makeHintRelative: !goneThroughPositioned,
						availableSpaceLeft,
						availableSpaceTop,
					};
				}

				if (hasTransform) {
					let availableSpaceLeft;
					let availableSpaceTop;
					if (currentStyle.overflow === "visible") {
						availableSpaceLeft = targetRect.x;
						availableSpaceTop = targetRect.y;
					} else {
						const containerRect = container.getBoundingClientRect();
						availableSpaceLeft = targetRect.x - containerRect.x;
						availableSpaceTop = targetRect.y - containerRect.y;
					}

					return {
						container,
						outermostPossibleContainer: current,
						makeHintRelative: false,
						availableSpaceLeft,
						availableSpaceTop,
					};
				}
			}

			if (
				!container &&
				((/hidden|auto/.test(currentStyle.overflow) && goneThroughPositioned) ||
					currentStyle.clipPath !== "none")
			) {
				candidate = undefined;
				goneThroughPositioned = false;
			}

			// If we get to the html element and the candidate doesn't have enough space we
			// need to place the hint in the candidate or the body if the candidate
			// has overflow hidden or auto
			if (current === document.documentElement) {
				container = candidate ?? document.body;
				return {
					container,
					outermostPossibleContainer: document.body,
					makeHintRelative: false,
					availableSpaceLeft: targetRect.x,
					availableSpaceTop: targetRect.y,
				};
			}
		}

		current = current.parentElement;
	}

	return {
		container: document.body,
		outermostPossibleContainer: document.body,
		makeHintRelative: false,
		availableSpaceLeft: targetRect.x,
		availableSpaceTop: targetRect.y,
	};
}
