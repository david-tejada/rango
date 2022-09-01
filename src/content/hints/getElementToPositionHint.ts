// Sometimes the element we want to hint contains another element where it makes
// more sense to position the hint. For example, an anchor tag in a sidebar could
// have a padding and inside it a small icon as an SVG and then a span. In this
// case it would make more sense to place the hint next to the SVG. Similarly,
// we always want the hint next to the text of the hinted element.

function hasSignificantText(element: Text): boolean {
	if (element.textContent && /\S/.test(element.textContent)) {
		return true;
	}

	return false;
}

export function getElementToPositionHint(element: HTMLElement): Element {
	let counter = 0;
	const treeWalker = document.createTreeWalker(
		element,
		NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_TEXT
	);
	let current = treeWalker.nextNode();

	while (counter < 5 && current) {
		if (current instanceof Text && hasSignificantText(current)) {
			return current.parentElement!;
		}

		if (current instanceof HTMLImageElement || current instanceof SVGElement) {
			return current;
		}

		current = treeWalker.nextNode();
		counter++;
	}

	return element;
}
