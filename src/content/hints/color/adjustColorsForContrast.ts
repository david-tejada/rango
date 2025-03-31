import type Color from "colorjs.io";
import { settingsSync } from "../../settings/settingsSync";
import { colors } from "./colors";

const normalContrastThreshold = 60;
const enhancedContrastThreshold = 80;

const cache = new Map<string, Color>();

export function getAdjustedForegroundColor(
	foreground: Color,
	background: Color
): Color {
	const cacheKey = `${foreground.toString()}:${background.toString()}`;
	if (cache.has(cacheKey)) return cache.get(cacheKey)!;

	const targetContrast = settingsSync.get("hintEnhancedContrast")
		? enhancedContrastThreshold
		: normalContrastThreshold;

	const initialContrast = background.contrastAPCA(foreground);

	if (Math.abs(initialContrast) >= targetContrast) {
		cache.set(cacheKey, foreground);
		return foreground;
	}

	const result = adjustLightnessForTargetContrast(
		foreground,
		background,
		targetContrast
	);

	cache.set(cacheKey, result);

	return result;
}

/**
 * Return a color based on the passed foreground color with the lightness
 * adjusted until the desired contrast is reached or the foreground color can't
 * be adjusted any further.
 */
function adjustLightnessForTargetContrast(
	foregroundColor: Color,
	backgroundColor: Color,
	targetContrast: number
) {
	const backgroundIsLight = isLight(backgroundColor);

	// We check if getting to an extreme lightness color still wouldn't give us
	// the desired target contrast. In that case there's no point in checking
	// further and we can use that extreme lightness color value.
	const extremeLightnessColor = backgroundIsLight
		? foregroundColor.to("oklch").set("l", 0)
		: foregroundColor.to("oklch").set("l", 1);

	const extremeLightnessColorContrast = backgroundColor.contrastAPCA(
		extremeLightnessColor
	);

	if (Math.abs(extremeLightnessColorContrast) < targetContrast) {
		return extremeLightnessColor;
	}

	// `high` and `low` here doesn't refer to the value itself but to the value
	// that achieves a low or high contrast. `low` itself might be higher than
	// `high`.
	let low = backgroundColor.to("oklch").get("l");
	let high = extremeLightnessColor.get("l");

	const currentForeground = foregroundColor.to("oklch");
	let currentContrast = backgroundColor.contrastAPCA(currentForeground);
	const contrastTolerance = 5;
	// This is a failsafe to prevent infinite loops. We should get to our target
	// value much earlier than this.
	const maxIterations = 10;
	let iteration = 0;

	while (
		iteration < maxIterations &&
		!isSlightlyAbove(
			Math.abs(currentContrast),
			targetContrast,
			contrastTolerance
		)
	) {
		const mid = (low + high) / 2;
		currentForeground.set("l", mid);

		currentContrast = backgroundColor.contrastAPCA(currentForeground);

		if (Math.abs(currentContrast) >= targetContrast) {
			high = mid;
		} else {
			low = mid;
		}

		iteration++;
	}

	currentForeground.set("l", high);

	return currentForeground;
}

/**
 * Determines whether a color is light or dark based on its contrast with black
 * and white.
 */
function isLight(backgroundColor: Color) {
	const contrastWithBlack = backgroundColor.contrastAPCA(colors.black);
	const contrastWithWhite = backgroundColor.contrastAPCA(colors.white);

	return Math.abs(contrastWithBlack) > Math.abs(contrastWithWhite);
}

function isSlightlyAbove(value: number, target: number, tolerance: number) {
	return value > target && value < target + tolerance;
}

settingsSync.onChange("hintEnhancedContrast", () => {
	cache.clear();
});
