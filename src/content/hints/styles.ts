import Color from "color";
import { Intersector } from "../../typing/types";
import {
	getInheritedBackgroundColor,
	getDefaultBackgroundColor,
} from "../utils/background-color";
import { getFirstTextNodeDescendant } from "../utils/nodes-utils";
import { getOption } from "../options/options";

// This is necessary to calculate background colors with alpha different than 1.
// It's usually rgba(0, 0, 0, 0)
const defaultBackgroundColor = getDefaultBackgroundColor();

export function applyInitialStyles(intersector: Intersector) {
	const backgroundColor = getInheritedBackgroundColor(
		intersector.element,
		defaultBackgroundColor || "rgba(0, 0, 0, 0)"
	);

	// We want our hint font color to match the font color of the text it's hinting
	const elementToGetColorFrom = getFirstTextNodeDescendant(
		intersector.element
	)?.parentElement;

	const colorString = window.getComputedStyle(
		elementToGetColorFrom ?? intersector.element
	).color;
	// Sometimes the color string we get is an empty string
	let color = new Color(colorString || "black");

	// If the element doesn't have any text just make sure there is contrast
	if (!elementToGetColorFrom) {
		if (backgroundColor.isDark() && color.isDark()) {
			color = new Color("white");
		}

		if (backgroundColor.isLight() && color.isLight()) {
			color = new Color("black");
		}
	}

	// A contrast value of 2.5 might seem low but it is necessary to match the look of some pages.
	// Some pages use low contrast with big text and, in my experience, it's more pleasant to keep
	// the aspect of the page. Having in mind that the text of the hints is not something that
	// the user would need to read continuously it might be acceptable to allow such a low contrast
	if (backgroundColor.contrast(color) < 2.5) {
		color = backgroundColor.isLight() ? new Color("black") : new Color("white");
	}

	const outlineColor = new Color(color).alpha(0.3);
	const hintFontSize = getOption("hintFontSize") as number;
	const fontWeight =
		backgroundColor.contrast(color) < 7 && hintFontSize < 14
			? "bold"
			: "normal";

	const styles = {
		backgroundColor: backgroundColor.string(),
		color: color.string(),
		outline: `1px solid ${outlineColor.string()}`,
		fontSize: `${hintFontSize}px`,
		fontWeight,
		padding: "0.15em",
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

export function flashHint(intersector: Intersector) {
	applyEmphasisStyles(intersector, true);
	setTimeout(() => {
		applyInitialStyles(intersector);
	}, 300);
}
