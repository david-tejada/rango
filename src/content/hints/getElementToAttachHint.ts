function hasSignificantText(element: Text): boolean {
	if (element.textContent && /\S/.test(element.textContent)) {
		return true;
	}

	return false;
}

export function getElementToAttachHint(element: HTMLElement): Element {
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
