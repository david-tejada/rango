import { IntersectingElement } from "../types/types";
import { getContrast, getLuminance, parseColor, getTintOrShade } from "./utils";
import {
	calculateHintPosition,
	getInheritedBackgroundColor,
	getDefaultBackgroundColor,
} from "./dom-utils";

const defaultBackgroundColor = getDefaultBackgroundColor();

export function applyInitialStyles(intersectingElement: IntersectingElement) {
	// Styles
	const [x, y] = calculateHintPosition(
		intersectingElement.element,
		intersectingElement.hintText!.length
	);
	const backgroundColor = getInheritedBackgroundColor(
		intersectingElement.element,
		defaultBackgroundColor || "rgba(0, 0, 0, 0)"
	);
	const outlineColor =
		getLuminance(parseColor(backgroundColor)) < 0.5
			? getTintOrShade(backgroundColor, 0.2)
			: getTintOrShade(backgroundColor, -0.2);
	let color = window.getComputedStyle(intersectingElement.element).color;
	const contrast = getContrast(backgroundColor, color);
	if (contrast < 4 || parseColor(color).a < 0.5) {
		color = getLuminance(parseColor(backgroundColor)) < 0.5 ? "#fff" : "#000";
	}

	const styles = {
		left: `${x}px`,
		top: `${y}px`,
		backgroundColor,
		color,
		outline: `1px solid ${outlineColor}`,
	};
	Object.assign((intersectingElement.hintElement as HTMLElement).style, styles);
	intersectingElement.hintElement!.className = "rango-hint";
}
