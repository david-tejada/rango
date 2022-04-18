import { ObservedElement } from "./types";

let hintsUpdateTriggered = false;

export function displayHints(observedElements: ObservedElement[]) {
	// We set a timeout in order to avoid updating the hints too often, for example,
	// when there are multiple mutations or intersections happening
	if (!hintsUpdateTriggered) {
		hintsUpdateTriggered = true;
		document.querySelector("#rango-hints-container")?.remove();
		setTimeout(() => {
			hintsUpdateTriggered = false;

			const hintsContainer = document.createElement("div");
			hintsContainer.id = "rango-hints-container";
			console.log(observedElements);

			const hints = observedElements.filter((ObservedElement) => {
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
		}, 300);
	}
}
