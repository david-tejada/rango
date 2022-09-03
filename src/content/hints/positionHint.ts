import { HintedIntersector } from "../../typings/Intersector";
import { assertDefined } from "../../typings/TypingUtils";
import { getTextNodeRect } from "../utils/nodeUtils";

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
	hintElement.style.display = "block";
	const rect = intersector.hintAnchorRect;
	assertDefined(rect);

	const scrollLeft =
		window.pageXOffset ||
		document.documentElement.scrollLeft ||
		document.body.scrollLeft;

	const scrollTop =
		window.pageYOffset ||
		document.documentElement.scrollTop ||
		document.body.scrollTop;

	const nudgeX = intersector.hintAnchorIsText ? 0.1 : 0.3;
	const nudgeY = 0.4;

	let x = rect.left + scrollLeft - hintElement.offsetWidth * (1 - nudgeX);
	x = x > 0 ? x : 0;
	let y = rect.top + scrollTop - hintElement.offsetHeight * (1 - nudgeY);
	y = y > 0 ? y : 0;

	hintElement.style.left = `${x}px`;
	hintElement.style.top = `${y}px`;

	const bottomAnchorRect =
		intersector.hintAnchorIsText && intersector.firstTextNodeDescendant
			? getTextNodeRect(intersector.firstTextNodeDescendant)
			: element.getBoundingClientRect();

	// Once the hint is at least 25% const castle, if there is space, we move it to the bottom left corner
	if (
		(bottomAnchorRect &&
			hintElement.getBoundingClientRect().top <
				-hintElement.offsetHeight * 0.25 &&
			bottomAnchorRect.y + bottomAnchorRect.height >
				hintElement.offsetHeight * 0.5) ||
		intersector.hintPlacement === "bottom"
	) {
		let targetX = bottomAnchorRect.x - hintElement.offsetWidth * (1 - nudgeX);
		targetX = targetX > 0 ? targetX : 0;
		let targetY =
			bottomAnchorRect.y +
			bottomAnchorRect.height -
			hintElement.offsetHeight * nudgeY;
		targetY = targetY > 0 ? targetY : 0;

		if (isHintThere(hintElement, targetX, targetY)) {
			hintElement.style.display = "none";
		} else {
			hintElement.style.left = `${scrollLeft + targetX}px`;
			hintElement.style.top = `${scrollTop + targetY}px`;
		}
	}

	intersector.hintElement.style.display = "block";
}
