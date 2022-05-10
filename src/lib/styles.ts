import { Intersector } from "../types/types";
import { getOption } from "./options";
import { getContrast, getLuminance, parseColor, getTintOrShade } from "./utils";
import {
	calculateHintPosition,
	getInheritedBackgroundColor,
	getDefaultBackgroundColor,
	getFirstTextNodeDescendant,
} from "./dom-utils";

const defaultBackgroundColor = getDefaultBackgroundColor();

export async function applyInitialStyles(intersector: Intersector) {
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
	const elementToGetColorFrom =
		(getFirstTextNodeDescendant(intersector.element) as Element)
			?.parentElement ?? intersector.element;
	let color = window.getComputedStyle(elementToGetColorFrom).color;
	const contrast = getContrast(backgroundColor, color);
	if (contrast < 4 || parseColor(color).a < 0.5) {
		color = getLuminance(parseColor(backgroundColor)) < 0.5 ? "#fff" : "#000";
	}

	const hintFontSize = getOption("hintFontSize") as number;

	const styles = {
		left: `${x}px`,
		top: `${y}px`,
		backgroundColor,
		color,
		outline: `1px solid ${outlineColor}`,
		fontSize: `${hintFontSize}px`,
		padding: "0.2em",
	};
	Object.assign((intersector.hintElement as HTMLElement).style, styles);
	intersector.hintElement!.className = "rango-hint";
}

export function applyEmphasisStyles(
	intersector: Intersector,
	dynamic: boolean
) {
	// We invert the colors for a visual clue
	const color = (intersector.hintElement as HTMLInputElement).style
		.backgroundColor;
	const background = (intersector.hintElement as HTMLInputElement).style.color;
	const transform = dynamic ? "scale(1.3, 1.3) translate(20%, 20%)" : "";
	const styles = {
		transform,
		background,
		color,
	};
	Object.assign((intersector.hintElement as HTMLElement).style, styles);
}
