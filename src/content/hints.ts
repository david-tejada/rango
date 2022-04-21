import { IntersectingElement } from "../types/types";
import { getLettersFromNumber } from "../lib/utils";
import {
	elementIsObscured,
	isPageDark,
	calculateHintPosition,
} from "../lib/dom-utils";

let hintsUpdateTriggered = false;
let showHints = true;

export function displayHints(intersectingElements: IntersectingElement[]) {
	// We set a timeout in order to avoid updating the hints too often, for example,
	// when there are multiple mutations or intersections happening
	if (showHints && !hintsUpdateTriggered) {
		hintsUpdateTriggered = true;
		setTimeout(() => {
			hintsUpdateTriggered = false;
			document.querySelector("#rango-hints-container")?.remove();
			const hintsContainer = document.createElement("div");
			hintsContainer.id = "rango-hints-container";
			for (const intersectingElement of intersectingElements) {
				intersectingElement.hintElement = undefined;
				intersectingElement.hintText = undefined;
			}

			console.log(intersectingElements);

			const hints = intersectingElements.filter((intersectingElement) => {
				return (
					intersectingElement.clickableType &&
					intersectingElement.isVisible &&
					!elementIsObscured(intersectingElement.element)
				);
			});

			for (const [index, hint] of hints.entries()) {
				if (!hint.hintElement) {
					hint.hintElement = document.createElement("div");
				}

				const [hintX, hintY] = calculateHintPosition(hint.element);

				const styles = {
					left: `${hintX}px`,
					top: `${hintY}px`,
				};
				Object.assign((hint.hintElement as HTMLElement).style, styles);
				hint.hintElement.textContent = `${getLettersFromNumber(index)}`;
				hint.hintElement.className = "rango-hint";
				hint.hintElement.classList.add(
					isPageDark() ? "rango-hint-dark" : "rango-hint-light"
				);
				hint.hintText = `${getLettersFromNumber(index)}`;
				hintsContainer.append(hint.hintElement);
			}

			console.log(hints);
			document.body.append(hintsContainer);
		}, 300);
	}
}

export function toggleHints() {
	const hintsContainer = document.querySelector("#rango-hints-container");
	if (showHints) {
		(hintsContainer as HTMLDivElement)!.style.display = "none";
	} else {
		(hintsContainer as HTMLDivElement)!.style.display = "block";
	}

	showHints = !showHints;
}
