import { IntersectingElement } from "./types";

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
					!isObscured(intersectingElement.element)
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
				hint.hintElement.textContent = `${getHintLetters(index)}`;
				hint.hintElement.className = "rango-hint";
				hint.hintElement.classList.add(
					isPageDark() ? "rango-hint-dark" : "rango-hint-light"
				);
				hint.hintText = `${getHintLetters(index)}`;
				hintsContainer.append(hint.hintElement);
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

export function toggleHints() {
	const hintsContainer = document.querySelector("#rango-hints-container");
	if (showHints) {
		(hintsContainer as HTMLDivElement)!.style.display = "none";
	} else {
		(hintsContainer as HTMLDivElement)!.style.display = "block";
	}

	showHints = !showHints;
}

function isObscured(element: Element): boolean {
	const rect = element.getBoundingClientRect();
	const elementFromPoint = document.elementFromPoint(rect.x + 5, rect.y + 5);
	if (
		elementFromPoint &&
		(element.contains(elementFromPoint) || elementFromPoint.contains(element))
	) {
		return false;
	}

	return true;
}

function getHintLetters(hintNumber: number): string {
	const codePointLowerA = 97;
	const lettersNumbers: number[] = [hintNumber];
	let result = "";
	let div: number;
	let sp = 0;

	// At the end of this while loop we will have an array with the numbers of the letters
	// from 0 (a) to 25 (z) in reversed order, for example: 35 -> [9, 0] -> ["j", "a"] -> "aj"
	while (sp < lettersNumbers.length) {
		if (lettersNumbers[sp]! > 25) {
			div = Math.floor(lettersNumbers[sp]! / 26);
			lettersNumbers[sp + 1] = div - 1;
			lettersNumbers[sp] %= 26;
		}

		sp += 1;
	}

	for (const letterNumber of lettersNumbers) {
		result = String.fromCodePoint(codePointLowerA + letterNumber) + result;
	}

	return result;
}
