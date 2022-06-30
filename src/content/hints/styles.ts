import Color from "color";
import { rgbaToRgb } from "../../lib/color-utils";
import { HintedIntersector } from "../../typing/types";
import {
	getInheritedBackgroundColor,
	getDefaultBackgroundColor,
} from "../utils/background-color";
import { getFirstTextNodeDescendant } from "../utils/nodes-utils";
import { getHintOption } from "../options/hint-style-options";

// This is necessary to calculate background colors with alpha different than 1.
// It's usually rgba(0, 0, 0, 0)
const defaultBackgroundColor = getDefaultBackgroundColor();

export function applyInitialStyles(intersector: HintedIntersector) {
	// This is here in case we are using keyboard clicking so that once we press one
	// key and the reachable elements are marked the style of those hints doesn't get reset
	if (intersector.freezeHintStyle) {
		return;
	}

	const subtleHints = getHintOption("hintStyle") === "subtle";
	intersector.backgroundColor = intersector.backgroundColor
		? intersector.backgroundColor
		: getInheritedBackgroundColor(
				intersector.element,
				defaultBackgroundColor || "rgba(0, 0, 0, 0)"
		  );
	const backgroundColor = intersector.backgroundColor;

	// We want our hint font color to match the font color of the text it's hinting
	intersector.firstTextNodeDescendant = intersector.firstTextNodeDescendant
		?.isConnected
		? intersector.firstTextNodeDescendant
		: getFirstTextNodeDescendant(intersector.element);

	const elementToGetColorFrom =
		intersector.firstTextNodeDescendant?.parentElement;

	const colorString = window.getComputedStyle(
		elementToGetColorFrom ?? intersector.element
	).color;
	// Sometimes the color string we get is an empty string. We also need to convert to rgb
	// because the contrast function doesn't take into account alpha values
	let color = rgbaToRgb(new Color(colorString || "black"), backgroundColor);

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
	const hintFontSize = getHintOption("hintFontSize") as number;

	const fontWeightOption = getHintOption("hintWeight");
	let fontWeight;
	if (fontWeightOption === "auto") {
		fontWeight =
			backgroundColor.contrast(color) < 7 && hintFontSize < 14
				? "bold"
				: "normal";
	} else {
		fontWeight = fontWeightOption;
	}

	const subtleBackground =
		subtleHints &&
		window.getComputedStyle(intersector.element).display.includes("inline");

	const styles = {
		backgroundColor: subtleBackground
			? "transparent"
			: backgroundColor.string(),
		color: color.string(),
		outline: subtleHints ? 0 : `1px solid ${outlineColor.string()}`,
		fontSize: `${hintFontSize}px`,
		fontWeight,
		padding: "0 0.15em",
	};
	Object.assign(intersector.hintElement.style, styles);
	intersector.hintElement.className = "rango-hint";
}

export function applyEmphasisStyles(
	intersector: HintedIntersector,
	dynamic: boolean,
	fontColor?: string,
	backgroundColor?: string
) {
	// We invert the colors for a visual clue
	const color = fontColor ?? intersector.backgroundColor;
	const background = backgroundColor ?? intersector.hintElement.style.color;
	const hintFontSize = getHintOption("hintFontSize") as number;
	const fontSize = dynamic ? `${hintFontSize * 1.2}px` : `${hintFontSize}px`;
	const styles = {
		fontSize,
		background,
		color,
	};
	Object.assign(intersector.hintElement.style, styles);
}

export function flashHint(
	intersector: HintedIntersector,
	fontColor?: string,
	backgroundColor?: string
) {
	applyEmphasisStyles(intersector, true, fontColor, backgroundColor);
	setTimeout(() => {
		applyInitialStyles(intersector);
	}, 300);
}
