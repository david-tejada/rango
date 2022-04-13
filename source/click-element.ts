import { displayHints, clearHints } from "./hints";
import { observedElements } from "./observed-elements";

export function clickElementByText(text: string): void {
	clearHints();
	const choices = observedElements.filter((observedElement) => {
		const textToSearch = text.toLowerCase().replace(" ", "");
		const textSearched = observedElement.element
			.textContent!.toLowerCase()
			.replace(" ", "");
		return (
			textSearched.includes(textToSearch) &&
			observedElement.isIntersecting &&
			observedElement.isVisible &&
			observedElement.clickableType
		);
	});

	if (choices.length > 1) {
		displayHints({ text });
	} else if (choices[0]) {
		clickElement(choices[0].element as HTMLElement);
	}
}

export function clickElementByHint(hintNumber: number) {
	const target = observedElements.find(
		(ObservedElement) => ObservedElement.hintText === String(hintNumber)
	);
	if (target) {
		clickElement(target.element as HTMLElement);
	}
}

function clickElement(element: HTMLElement) {
	clearHints();
	const previousOutline = element.style.outline;
	element.style.outline = "#247881 solid 2px";
	setTimeout(() => {
		element?.click();
		element.style.outline = previousOutline;
	}, 200);
}
