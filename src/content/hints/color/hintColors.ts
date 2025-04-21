import Color from "colorjs.io";
import { settingsSync } from "../../settings/settingsSync";
import { matchesStagedSelector } from "../customHints/customSelectorsStaging";
import { getCachedStyle } from "../layoutCache";
import { getAdjustedForegroundColor } from "./adjustColorsForContrast";
import { green, red, white } from "./colors";
import { compositeColors } from "./compositeColors";
import { resolveBackgroundColor } from "./resolveBackgroundColor";

export function getHintBackgroundColor(
	target: Element,
	referenceElement: Element
) {
	const isIncludeMarked = matchesStagedSelector(target, true);
	const isExcludeMarked = matchesStagedSelector(target, false);

	if (isIncludeMarked) return green;
	if (isExcludeMarked) return red;

	const customBackgroundColor = settingsSync.get("hintBackgroundColor");
	const customBackgroundOpacity = settingsSync.get("hintBackgroundOpacity");

	if (customBackgroundColor) {
		const backgroundColor = new Color(customBackgroundColor);

		// If the custom background color is opaque we use the custom alpha,
		// otherwise the color uses the custom background color opacity.
		if (backgroundColor.alpha.valueOf() === 1) {
			backgroundColor.alpha = customBackgroundOpacity;
		}

		return backgroundColor;
	}

	const backgroundColor = resolveBackgroundColor(
		referenceElement.isConnected ? referenceElement : target
	);
	backgroundColor.alpha = customBackgroundOpacity;

	return backgroundColor;
}

export function getHintForegroundColor(
	target: Element,
	backgroundColor: Color,
	referenceElement: Element
) {
	const isIncludeMarked = matchesStagedSelector(target, true);
	const isExcludeMarked = matchesStagedSelector(target, false);

	if (isIncludeMarked || isExcludeMarked) return white;

	const customFontColor = settingsSync.get("hintFontColor");
	const customBackgroundColor = settingsSync.get("hintBackgroundColor");

	if (customFontColor && customBackgroundColor) {
		return new Color(customFontColor);
	}

	const rawColor = getColorFromElement(
		referenceElement.isConnected ? referenceElement : target
	);
	const compositedColor = compositeColors([backgroundColor, rawColor]);

	return getAdjustedForegroundColor(compositedColor, backgroundColor);
}

function getColorFromElement(element: Element) {
	if (element instanceof SVGElement) {
		return getColorFromSvgElement(element);
	}

	return new Color(getCachedStyle(element).color);
}

function getColorFromSvgElement(element: SVGElement) {
	const color = getStrokeOrFillColor(element);
	if (color) return color;

	const descendantWithStrokeOrFill: SVGElement | null =
		element.querySelector("[stroke]:not([stroke='none'])") ??
		element.querySelector("[fill]:not([fill='none'])");

	if (descendantWithStrokeOrFill) {
		const color = getStrokeOrFillColor(descendantWithStrokeOrFill);
		if (color) return color;
	}

	return new Color(getCachedStyle(element).color);
}

function getStrokeOrFillColor(element: SVGElement) {
	const stroke = getCachedStyle(element).stroke;
	if (CSS.supports("color", stroke)) return new Color(stroke);

	const fill = getCachedStyle(element).fill;
	if (CSS.supports("color", fill)) return new Color(fill);

	return undefined;
}
