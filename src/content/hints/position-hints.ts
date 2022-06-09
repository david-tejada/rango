import { HintedIntersector } from "../../typing/types";
import {
	getFirstCharacterRect,
	getFirstTextNodeDescendant,
} from "../utils/nodes-utils";

function isHintThere(
	hintElement: HTMLDivElement,
	x: number,
	y: number
): boolean {
	const hintRect = hintElement.getBoundingClientRect();
	const bottomLeftElement = document.elementFromPoint(
		x,
		y + hintRect.height - 2
	);
	const bottomCenterElement = document.elementFromPoint(
		x + hintRect.width / 2,
		y + hintRect.height - 2
	);
	const bottomRightElement = document.elementFromPoint(
		x + hintRect.width,
		y + hintRect.height - 2
	);
	const centerElement = document.elementFromPoint(
		x + hintRect.width / 2,
		y + hintRect.height / 2
	);

	if (
		bottomLeftElement?.className === "rango-hint" ||
		bottomCenterElement?.className === "rango-hint" ||
		bottomRightElement?.className === "rango-hint" ||
		centerElement?.className === "rango-hint"
	) {
		return true;
	}

	return false;
}

export function positionHint(intersector: HintedIntersector) {
	const element = intersector.element as HTMLElement;
	const hintElement = intersector.hintElement;
	intersector.firstTextNodeDescendant = intersector.firstTextNodeDescendant
		?.isConnected
		? intersector.firstTextNodeDescendant
		: getFirstTextNodeDescendant(intersector.element);
	let rect;

	// With small buttons we just place the hint at the top left of the button,
	// no matter if they have text content or not. This gives a more consistent look
	if (
		element.tagName === "BUTTON" &&
		element.offsetHeight < hintElement.offsetHeight * 2
	) {
		rect = element.getBoundingClientRect();
	} else {
		// If the element has text, we situate the hint next to the first character
		// in case the text spans multiple lines
		rect =
			getFirstCharacterRect(intersector.firstTextNodeDescendant) ??
			element.getBoundingClientRect();
	}

	const scrollLeft =
		window.pageXOffset ||
		document.documentElement.scrollLeft ||
		document.body.scrollLeft;

	const scrollTop =
		window.pageYOffset ||
		document.documentElement.scrollTop ||
		document.body.scrollTop;

	const nudgeX = 0.3;
	const nudgeY = 0.4;

	let x = rect.left + scrollLeft - hintElement.offsetWidth * (1 - nudgeX);
	x = x > 0 ? x : 0;
	let y = rect.top + scrollTop - hintElement.offsetHeight * (1 - nudgeY);
	y = y > 0 ? y : 0;

	hintElement.style.left = `${x}px`;
	hintElement.style.top = `${y}px`;

	const anchorRect =
		getFirstCharacterRect(intersector.firstTextNodeDescendant) ??
		element.getBoundingClientRect();

	// Once the hint is at least 25% hidden, if there is space, we move it to the bottom left corner
	if (
		anchorRect &&
		hintElement.getBoundingClientRect().top <
			-hintElement.offsetHeight * 0.25 &&
		anchorRect.y + anchorRect.height > hintElement.offsetHeight * 0.5
	) {
		let targetX = anchorRect.x - hintElement.offsetWidth * (1 - nudgeX);
		targetX = targetX > 0 ? targetX : 0;
		let targetY =
			anchorRect.y + anchorRect.height - hintElement.offsetHeight * nudgeY;
		targetY = targetY > 0 ? targetY : 0;

		if (!isHintThere(hintElement, targetX, targetY)) {
			hintElement.style.left = `${scrollLeft + targetX}px`;
			hintElement.style.top = `${scrollTop + targetY}px`;
		}
	}
}
