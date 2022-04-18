import { ObservedElement } from "./types";

let hintsUpdateTriggered = false;

export function displayHints(observedElements: ObservedElement[]) {
	// We set a timeout in order to avoid updating the hints too often, for example,
	// when there are multiple mutations or intersections happening
	if (!hintsUpdateTriggered) {
		hintsUpdateTriggered = true;
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
				let hintLeft =
					rect.left +
					window.scrollX +
					Number.parseInt(
						window.getComputedStyle(hint.element).paddingLeft,
						10
					) -
					10;
				if (hintLeft < 0) {
					hintLeft = 0;
				}

				let hintTop =
					rect.top +
					window.scrollY +
					Number.parseInt(
						window.getComputedStyle(hint.element).paddingTop,
						10
					) -
					10;
				if (hintTop < 0) {
					hintTop = 0;
				}

				const styles = {
					left: `${hintLeft}px`,
					top: `${hintTop}px`,
				};
				Object.assign((hint.hintElement as HTMLElement).style, styles);
				hint.hintElement.textContent = `${index}`;
				hint.hintElement.className = "hint";
				hint.hintText = `${index}`;
				hintsContainer.append(hint.hintElement);
			}

			console.log(hints);
			document.querySelector("#rango-hints-container")?.remove();
			document.body.append(hintsContainer);
		}, 300);
	}
}
