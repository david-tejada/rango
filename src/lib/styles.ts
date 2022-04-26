import { Intersector } from "../types/types";
import { getContrast, getLuminance, parseColor, getTintOrShade } from "./utils";
import {
	calculateHintPosition,
	getInheritedBackgroundColor,
	getDefaultBackgroundColor,
} from "./dom-utils";

const defaultBackgroundColor = getDefaultBackgroundColor();

export function applyInitialStyles(intersector: Intersector) {
	// Styles
	const [x, y] = calculateHintPosition(
		intersector.element,
		intersector.hintText!.length
	);
	const backgroundColor = getInheritedBackgroundColor(
		intersector.element,
		defaultBackgroundColor || "rgba(0, 0, 0, 0)"
	);
	const outlineColor =
		getLuminance(parseColor(backgroundColor)) < 0.5
			? getTintOrShade(backgroundColor, 0.2)
			: getTintOrShade(backgroundColor, -0.2);
	let color = window.getComputedStyle(intersector.element).color;
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
		fontSize: "10px",
		padding: "0.2em",
	};
	Object.assign((intersector.hintElement as HTMLElement).style, styles);
	intersector.hintElement!.className = "rango-hint";
}

export function applyEmphasisStyles(intersector: Intersector) {
	// We invert the colors for a visual clue
	const color = (intersector.hintElement as HTMLInputElement).style
		.backgroundColor;
	const background = (intersector.hintElement as HTMLInputElement).style.color;
	const styles = {
		padding: "0.4em",
		fontSize: "12px",
		background,
		color,
	};
	Object.assign((intersector.hintElement as HTMLElement).style, styles);
}
