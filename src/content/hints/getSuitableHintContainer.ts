// This functions returns the first suitable ancestor to place the hint where it
// won't be hidden by overflow hidden or auto. Although there are some occasions
// where we can't assure that the hint won't be hidden by overflow hidden or auto.

export function getSuitableHintContainer(element: Element): HTMLElement {
	const elementRect = element.getBoundingClientRect();
	const minLeft = 10;
	const minTop = 10;

	// This is the element that we are currently checking if it has sufficient
	// space around so that the hint isn't hidden
	let candidate;

	let current = element.parentElement;

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

		// The style.display check doesn't always ensure semantic correctness.
		// For example, having a div inside a button is not semantically correct
		// even if the button is display: block. I'm not sure if semantic correctness
		// is something we should strive for, anyway. I've also tried to place hints inside
		// inline elements but it breaks some pages (Slack, for example).
		if (
			!candidate &&
			/block|grid|flex|root|list-item/.test(currentStyle.display)
		) {
			candidate = current;
		}

		if (candidate) {
			const rect = current.getBoundingClientRect();

			// We need to take into account the border since we need the distance from
			// the target element to the padding box of the current element
			const borderLeft = Number.parseInt(currentStyle.borderLeftWidth, 10);
			const borderTop = Number.parseInt(currentStyle.borderTopWidth, 10);

			if (
				elementRect.x - rect.x + borderLeft >= minLeft &&
				elementRect.y - rect.y + borderTop >= minTop
			) {
				return candidate;
			}

			// If the current element is a scroll container or position fixed or sticky
			// we can't go beyond as we need the hint to stay within those elements.
			if (
				((current.scrollHeight > current.clientHeight ||
					current.scrollWidth > current.clientWidth) &&
					/scroll|auto/.test(currentStyle.overflow)) ||
				currentStyle.position === "fixed" ||
				currentStyle.position === "sticky"
			) {
				if (/hidden|auto/.test(window.getComputedStyle(candidate).overflow)) {
					return current;
				}

				return candidate;
			}

			if (/hidden|auto/.test(currentStyle.overflow)) {
				candidate = undefined;
			}

			// If we get to the body and the candidate doesn't have enough space we
			// need to place the hint in the candidate or the body if the candidate
			// has overflow hidden or auto
			if (current === document.body) {
				return candidate ?? current;
			}
		}

		current = current.parentElement;
	}

	return document.body;
}
