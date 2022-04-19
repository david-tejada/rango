import { IntersectingElement } from "./types";

let hintsUpdateTriggered = false;

export function displayHints(intersectingElements: IntersectingElement[]) {
	// We set a timeout in order to avoid updating the hints too often, for example,
	// when there are multiple mutations or intersections happening
	if (!hintsUpdateTriggered) {
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

			const hints = intersectingElements.filter((IntersectingElement) => {
				return (
					IntersectingElement.clickableType && IntersectingElement.isVisible
				);
			});

			for (const [index, hint] of hints.entries()) {
				if (!hint.hintElement) {
					hint.hintElement = document.createElement("div");
				}

				const rect = hint.element.getBoundingClientRect();
				const elementFromPoint = document.elementFromPoint(
					rect.x + 5,
					rect.y + 5
				);
				if (
					elementFromPoint &&
					(hint.element.contains(elementFromPoint) ||
						elementFromPoint.contains(hint.element))
				) {
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
					hint.hintElement.className = "rango-hint";
					hint.hintElement.classList.add(
						isPageDark() ? "rango-hint-dark" : "rango-hint-light"
					);
					hint.hintText = `${index}`;
					hintsContainer.append(hint.hintElement);
				}
			}

			console.log(hints);
			document.body.append(hintsContainer);
		}, 300);
	}
}

function isPageDark() {
	const backgroundColor = window.getComputedStyle(
		document.body
	).backgroundColor;
	const [red, green, blue] = backgroundColor
		.replace(/[^\d,]/g, "")
		.split(",")
		.map((v) => Number(v));
	const luma = 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
	return luma < 40;
}
