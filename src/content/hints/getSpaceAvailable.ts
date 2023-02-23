import { getPaddingRect, isUserScrollable } from "../utils/cssomUtils";
import {
	getBoundingClientRect,
	getCachedStyle,
	getFirstCharacterRect,
} from "./layoutCache";

export function getAvailableSpace(
	container: HTMLElement | ShadowRoot,
	elementToPositionHint: Element | Text
) {
	const targetRect =
		elementToPositionHint instanceof Text
			? getFirstCharacterRect(elementToPositionHint)
			: getBoundingClientRect(elementToPositionHint);

	const containerForRect =
		container instanceof HTMLElement ? container : container.host;

	// To use when overflow: visible;
	const borderRect = getBoundingClientRect(containerForRect);
	const borderInnerLeft = targetRect.left - borderRect.left;
	const borderInnerTop = targetRect.top - borderRect.top;

	// To use when overflow: hidden|clip|scroll|auto;
	const paddingRect = getPaddingRect(containerForRect);
	const paddingInnerLeft = targetRect.left - paddingRect.left;
	const paddingInnerTop = targetRect.top - paddingRect.top;

	const {
		position,
		overflow,
		clipPath,
		contentVisibility,
		left: styleLeft,
		top: styleTop,
	} = getCachedStyle(containerForRect);

	// We make sure to return 0 if any of the values are negative. This could
	// happen if the element to position hint is not within the container. For example,
	// if the element is hidden by making it unreachable
	if (isUserScrollable(containerForRect)) {
		// We do Math.max to handle hidden elements that are unreachable (they remain
		// outside of the bounds of the container no matter how much we scroll)
		// We could return a negative value of available space but that messes up
		// calculations when positioning the hint
		return {
			left: Math.max(containerForRect.scrollLeft + paddingInnerLeft, 0),
			top: Math.max(containerForRect.scrollTop + paddingInnerTop, 0),
		};
	}

	// We don't need to worry about scroll containers here because that is
	// handled in the previous if block
	// We treat elements with clip-path the same as if it was overflow: hidden.
	// Calculating exactly what is the visible area of the element would be a nightmare
	if (
		overflow !== "visible" ||
		clipPath !== "none" ||
		(contentVisibility && contentVisibility !== "visible")
	) {
		return {
			left: Math.max(paddingInnerLeft, 0),
			top: Math.max(paddingInnerTop, 0),
		};
	}

	if (position === "fixed") {
		// There is a possibility that these values are wrong if the fixed
		// positioning containing block is not the viewport, although it's a
		// rare case and I don't think it's worth it to worry too much about it
		// https://.github.io/csswg-drafts/css-position/#fixed-positioning-containing-block
		return {
			left: Math.max(borderInnerLeft, 0),
			top: Math.max(borderInnerTop, 0),
		};
	}

	if (position === "sticky") {
		const stickyLeft = Number.parseInt(styleLeft, 10);
		const stickyTop = Number.parseInt(styleTop, 10);

		// These values are the minimum space available that we are going to have.
		// It could be greater if, for example, the sticky element hasn't sticked yet
		// or if the scroll container for the sticky has overflow: hidden un thus
		// does doesn't scroll
		const left = Number.isNaN(stickyLeft)
			? borderInnerLeft
			: stickyLeft + borderInnerLeft;
		const top = Number.isNaN(stickyTop)
			? borderInnerTop
			: stickyTop + borderInnerTop;

		return { left: Math.max(left, 0), top: Math.max(top, 0) };
	}

	// There is nothing clipping the container, the space available is that
	// offered by the document
	const scrollLeft = Math.max(
		document.body.scrollLeft,
		document.documentElement.scrollLeft
	);
	const scrollTop = Math.max(
		document.body.scrollTop,
		document.documentElement.scrollTop
	);

	return {
		left: Math.max(targetRect.left + scrollLeft, 0),
		top: Math.max(targetRect.top + scrollTop, 0),
	};
}
