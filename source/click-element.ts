import { intersectingElements } from "./intersecting-elements";

export function clickElementByHint(hintNumber: number) {
	const target = intersectingElements.find(
		(intersectingElement) => intersectingElement.hintText === String(hintNumber)
	);
	if (target && target.element.tagName === "INPUT") {
		(target.element as HTMLInputElement).focus();
	} else if (target) {
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
