import Color from "colorjs.io";
import { settingsSync } from "../../settings/settingsSync";
import { matchesStagedSelector } from "../customHints/customSelectorsStaging";
import { getAdjustedForegroundColor } from "./adjustColorsForContrast";
import { colors } from "./colors";
import { compositeColors } from "./compositeColors";
import { resolveBackgroundColor } from "./resolveBackgroundColor";

const normalContrastThreshold = 60;
const enhancedContrastThreshold = 80;

export function getHintBackgroundColor(target: Element) {
	const isIncludeMarked = matchesStagedSelector(target, true);
	const isExcludeMarked = matchesStagedSelector(target, false);

	if (isIncludeMarked) return colors.green;
	if (isExcludeMarked) return colors.red;

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

	const backgroundColor = resolveBackgroundColor(target);
	backgroundColor.alpha = customBackgroundOpacity;

	return backgroundColor;
}

export function getHintForegroundColor(
	target: Element,
	backgroundColor: Color,
	firstTextNodeDescendant: Text | undefined
) {
	const isIncludeMarked = matchesStagedSelector(target, true);
	const isExcludeMarked = matchesStagedSelector(target, false);

	if (isIncludeMarked || isExcludeMarked) return colors.white;

	const customFontColor = settingsSync.get("hintFontColor");
	const customBackgroundColor = settingsSync.get("hintBackgroundColor");

	if (customFontColor && customBackgroundColor) {
		return new Color(customFontColor);
	}

	const elementToGetColorFrom =
		firstTextNodeDescendant?.parentElement ?? target;

	const rawColor = new Color(getComputedStyle(elementToGetColorFrom).color);
	if (rawColor.alpha.valueOf() === 0) rawColor.alpha = 1;

	const compositedColor = compositeColors([backgroundColor, rawColor]);

	const contrastThreshold = settingsSync.get("hintEnhancedContrast")
		? enhancedContrastThreshold
		: normalContrastThreshold;

	return getAdjustedForegroundColor(
		compositedColor,
		backgroundColor,
		contrastThreshold
	);
}
