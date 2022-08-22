// This functions returns the first suitable ancestor to place the hint where it

import { resizeObserver } from "../observers";

// won't be hidden by overflow hidden or auto
export function getSuitableHintContainer(element: Element): HTMLElement {
	const elementRect = element.getBoundingClientRect();
	const bodyRect = document.body.getBoundingClientRect();

	// We take into account if the element is near the limit of the document
	const minLeft = Math.min(10, elementRect.x - bodyRect.x);
	const minTop = Math.min(10, elementRect.y - bodyRect.y);

	// This is the element that we are currently checking if it has sufficient
	// space around so that the hint isn't hidden
	let candidate;

	let current = element.parentElement;

	while (current) {
		// We can't place the hint inside of a <details> element because it will be hidden
		if (current instanceof HTMLDetailsElement) {
			current = current.parentElement;
			continue;
		}

		const style = window.getComputedStyle(current);

		// If the current element is a scroll container we can't go beyond as we
		// need the hint to stay within its scrolling container
		if (
			(current.scrollHeight > current.clientHeight ||
				current.scrollWidth > current.clientWidth) &&
			/scroll|auto/.test(style.overflow)
		) {
			resizeObserver.observe(current);
			return current;
		}

		if (style.position === "fixed" || style.position === "sticky") {
			resizeObserver.observe(current);
			return current;
		}

		// The style.display check doesn't always ensure semantic correctness.
		// For example, having a div inside a button is not semantically correct
		// even if the button is display: block. I'm not sure if semantic correctness
		// is something we should strive for, anyway. I've also tried to place hints inside
		// inline elements but it breaks some pages (Slack, for example).
		if (!candidate && /block|grid|flex|root/.test(style.display)) {
			candidate = current;
		}

		if (candidate) {
			const rect = current.getBoundingClientRect();

			// We need to take into account the border since we need the distance from
			// the target element to the padding box of the current element
			const borderLeft = Number.parseInt(style.borderLeftWidth, 10);
			const borderTop = Number.parseInt(style.borderTopWidth, 10);

			if (
				elementRect.x - rect.x + borderLeft >= minLeft &&
				elementRect.y - rect.y + borderTop >= minTop
			) {
				resizeObserver.observe(candidate);
				return candidate;
			}

			if (/hidden|auto/.test(style.overflow)) {
				candidate = undefined;
			}
		}

		current = current.parentElement;
	}

	return document.body;
}
