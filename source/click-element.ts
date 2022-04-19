import { observedElements } from "./observed-elements";

export function clickElementByHint(hintNumber: number) {
	const target = observedElements.find(
		(observedElement) => observedElement.hintText === String(hintNumber)
	);
	if (target) {
		clickElement(target.element as HTMLElement);
	}
}

function clickElement(element: HTMLElement) {
	const previousOutline = element.style.outline;
	element.style.outline = "#247881 solid 2px";
	setTimeout(() => {
		element?.click();
		element.style.outline = previousOutline;
	}, 200);
}
