let hintElements: HTMLElement[];

export function setHints(elements: HTMLElement[]) {
	hintElements = elements;
}

export function getHints(): HTMLElement[] {
	return hintElements;
}

export function displayHints() {
	const hintsContainer = document.createElement("div");
	hintsContainer.id = "hints-container";

	for (const [index, element] of hintElements.entries()) {
		const hint = document.createElement("div");
		const rect = element.getBoundingClientRect();
		const left = rect.left;
		const top = rect.top;
		const styles = {
			zIndex: "99999",
			position: "fixed",
			background: "#333",
			borderRadius: "10%",
			color: "#fff",
			padding: "6px",
			width: "auto",
			height: "auto",
			lineHeight: "14px",
			fontFamily: "monospace",
			left: `${left}px`,
			top: `${top}px`,
		};
		Object.assign(hint.style, styles);
		hint.textContent = `${index}`;
		hintsContainer.append(hint);
	}

	document.body.append(hintsContainer);
}

export function clearHints() {
	const hintsContainer = document.querySelector("div#hints-container");
	if (hintsContainer) {
		hintsContainer.remove();
	}
}
