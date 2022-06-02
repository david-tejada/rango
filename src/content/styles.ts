import { Intersector } from "../typing/types";
import {
	getContrast,
	getLuminance,
	parseColor,
	getTintOrShade,
} from "../lib/utils";
import {
	calculateHintPosition,
	getInheritedBackgroundColor,
	getDefaultBackgroundColor,
	getFirstTextNodeDescendant,
} from "../lib/dom-utils";
import { getOption } from "./options";

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
	const hintFontSize = getOption("hintFontSize") as number;
	const fontSize = dynamic ? `${hintFontSize * 1.2}px` : `${hintFontSize}px`;
	const styles = {
		fontSize,
		background,
		color,
	};
	Object.assign((intersector.hintElement as HTMLElement).style, styles);
}
