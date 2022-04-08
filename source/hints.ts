import { Hint } from "./types";

const hints: Set<Hint> = new Set();

export function setHints(elements: HTMLElement[]) {
	for (const [index, element] of elements.entries()) {
		hints.add({
			type: getElementType(element),
			element,
			elementTextContent: element.textContent ?? "",
			hintNode: document.createElement("div"),
			text: index,
		});
	}
}

export function getHints(): Hint[] {
	return Array.from(hints);
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
	hints.clear();
	const hintsContainer = document.querySelector("div#hints-container");
	if (hintsContainer) {
		hintsContainer.remove();
	}
}

function getElementType(element: HTMLElement) {
	if (element.tagName === "BUTTON") return "button";
	if (element.tagName === "A") return "a";
	if (element.tagName === "INPUT") return "input";
	if (element.getAttribute("role") === "treeitem") return "treeitem";
	if (element.onclick !== null) return "onclick";
	return undefined;
}
