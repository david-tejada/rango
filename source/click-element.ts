import { displayHints, clearHints, setHints, getHints } from "./hints";
import getVisibleClickableElements from "./clickable-elements";

const visibleClickableElements = getVisibleClickableElements();

export function clickElementByText(text: string): void {
	clearHints();
	const choices = Array.from(visibleClickableElements).filter((a) => {
		return a.textContent!.toLowerCase().includes(text.toLowerCase());
	}) as HTMLElement[];

	if (choices.length > 1) {
		setHints(choices);
		displayHints();
	} else if (choices[0]) {
		clickElement(choices[0]);
	}
}

export function clickElementByHint(hint: number) {
	const choices = getHints();
	const target = choices[hint];
	if (target) {
		clickElement(target);
	}
}

function clickElement(element: HTMLElement) {
	clearHints();
	const previousColor = element.style.color;
	const previousBackground = element.style.background;
	element.style.background = "#FF8AAE";
	element.style.color = "#fff";
	setTimeout(() => {
		element?.click();
		element.style.background = previousBackground;
		element.style.color = previousColor;
	}, 200);
}
