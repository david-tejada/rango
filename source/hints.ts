import { Hint } from "./types";

let hints: Hint[];

export function setHints(elements: HTMLElement[]) {
	hints = elements.map((element, index) => ({
		element,
		hintNode: document.createElement("div"),
		text: index,
	}));
}

export function getHints(): Hint[] {
	return hints;
}

export function displayHints() {
	const hintsContainer = document.createElement("div");
	hintsContainer.id = "hints-container";

	for (const hint of hints) {
		const rect = hint.element.getBoundingClientRect();
		const left = rect.left;
		const top = rect.top;
		const styles = {
			zIndex: "99999",
			position: "absolute",
			background: "#333",
			borderRadius: "10%",
			color: "#fff",
			padding: "2px",
			width: "auto",
			height: "auto",
			lineHeight: "14px",
			fontFamily: "monospace",
			left: `${left + window.scrollX}px`,
			top: `${top + window.scrollY}px`,
		};
		Object.assign(hint.hintNode.style, styles);
		hint.hintNode.textContent = `${hint.text}`;
		hintsContainer.append(hint.hintNode);
	}

	document.body.append(hintsContainer);
}

export function clearHints() {
	const hintsContainer = document.querySelector("div#hints-container");
	if (hintsContainer) {
		hintsContainer.remove();
	}
}
