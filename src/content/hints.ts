import { IntersectingElement } from "../types/types";
import {
	getLettersFromNumber,
	getContrast,
	getLuminance,
	parseColor,
} from "../lib/utils";
import {
	elementIsObscured,
	calculateHintPosition,
	getDefaultBackgroundColor,
	getInheritedBackgroundColor,
} from "../lib/dom-utils";

let hintsUpdateTriggered = false;
let showHints = true;
const defaultBackgroundColor = getDefaultBackgroundColor();

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
				hint.hintElement = document.createElement("div");
				hint.hintText = `${getLettersFromNumber(index)}`;
				hint.hintElement.textContent = `${hint.hintText}`;

				// Styles
				const [x, y] = calculateHintPosition(
					hint.element,
					hint.hintText.length
				);
				const backgroundColor = getInheritedBackgroundColor(
					hint.element,
					defaultBackgroundColor || "rgba(0, 0, 0, 0)"
				);
				let color = window.getComputedStyle(hint.element).color;
				const contrast = getContrast(backgroundColor, color);
				if (contrast < 4 || parseColor(color).a < 0.5) {
					color =
						getLuminance(parseColor(backgroundColor)) < 0.5 ? "#fff" : "#000";
				}

				const styles = {
					left: `${x}px`,
					top: `${y}px`,
					backgroundColor,
					color,
				};
				Object.assign((hint.hintElement as HTMLElement).style, styles);
				hint.hintElement.className = "rango-hint";

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
