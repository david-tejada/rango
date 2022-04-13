import { HintConfig } from "./types";
import { observedElements } from "./observed-elements";

const hintsContainer = document.createElement("div");
hintsContainer.id = "hints-container";

export function displayHints(config?: HintConfig) {
	performance.mark("start displayHints");
	console.log(observedElements);

	const hints = observedElements.filter((ObservedElement) => {
		if (config?.text) {
			return (
				ObservedElement.clickableType &&
				ObservedElement.isIntersecting &&
				ObservedElement.isVisible &&
				ObservedElement.element.textContent?.toLowerCase().includes(config.text)
			);
		}

		return (
			ObservedElement.clickableType &&
			ObservedElement.isIntersecting &&
			ObservedElement.isVisible
		);
	});

	for (const [index, hint] of hints.entries()) {
		if (!hint.hintElement) {
			hint.hintElement = document.createElement("div");
		}

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
			lineHeight: "10px",
			fontFamily: "monospace",
			fontSize: "10px",
			left: `${left + window.scrollX - 10}px`,
			top: `${top + window.scrollY - 10}px`,
		};
		Object.assign((hint.hintElement as HTMLElement).style, styles);
		hint.hintElement.textContent = `${index}`;
		hint.hintText = `${index}`;
		hintsContainer.append(hint.hintElement);
	}

	console.log(hints);
	document.body.append(hintsContainer);
	performance.measure("Hints", "start displayHints");
}

export function clearHints() {
	hintsContainer.innerHTML = "";
}
