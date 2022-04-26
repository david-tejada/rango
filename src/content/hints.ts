import { Intersector } from "../types/types";
import { getLettersFromNumber } from "../lib/utils";
import { elementIsObscured } from "../lib/dom-utils";
import { applyInitialStyles } from "../lib/styles";

let hintsUpdateTriggered = false;
let showHints = true;

export function displayHints(intersectors: Intersector[]) {
	// We set a timeout in order to avoid updating the hints too often, for example,
	// when there are multiple mutations or intersections happening
	if (showHints && !hintsUpdateTriggered) {
		hintsUpdateTriggered = true;
		setTimeout(() => {
			hintsUpdateTriggered = false;
			document.querySelector("#rango-hints-container")?.remove();
			const hintsContainer = document.createElement("div");
			hintsContainer.id = "rango-hints-container";
			for (const intersector of intersectors) {
				intersector.hintElement = undefined;
				intersector.hintText = undefined;
			}

			console.log(intersectors);

			const hints = intersectors.filter((intersector) => {
				return (
					intersector.clickableType &&
					intersector.isVisible &&
					!elementIsObscured(intersector.element)
				);
			});

			for (const [index, hint] of hints.entries()) {
				hint.hintElement = document.createElement("div");
				hint.hintText = `${getLettersFromNumber(index)}`;
				hint.hintElement.textContent = `${hint.hintText}`;

				applyInitialStyles(hint);

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
