export function findLastTextNode(element: Node): Text | undefined {
	if (element instanceof Text) return element;

	for (let i = element.childNodes.length - 1; i >= 0; i--) {
		const lastTextNode = findLastTextNode(element.childNodes[i]!);

		if (lastTextNode) return lastTextNode;
	}

	return undefined;
}

export function findFirstTextNode(element: Node): Text | undefined {
	if (element instanceof Text) return element;

	for (const child of element.childNodes) {
		const firstTextNode = findFirstTextNode(child);

		if (firstTextNode) return firstTextNode;
	}

	return undefined;
}
