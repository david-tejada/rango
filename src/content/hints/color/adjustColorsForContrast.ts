import Color from "colorjs.io";
import { clamp } from "lodash";

const colorBlack = new Color("black");
const colorBlackString = colorBlack.toString();
const colorWhite = new Color("white");
const colorWhiteString = colorWhite.toString();

const cache = new Map<string, Color>();

export function getAdjustedForegroundColor(
	foreground: Color,
	background: Color,
	targetContrast: number
): Color {
	const cacheKey = `${foreground.toString()}:${background.toString()}:${targetContrast}`;

	if (cache.has(cacheKey)) {
		return cache.get(cacheKey)!;
	}

	const initialContrast = background.contrastAPCA(foreground);

	if (Math.abs(initialContrast) >= targetContrast) {
		cache.set(cacheKey, foreground);
		return foreground;
	}

	// We can't lighten or darken pure black or white, so if that's the foreground
	// color passed in we use the middle lightness value.
	const foregroundString = foreground.toString();
	const isPureBlackOrWhite =
		foregroundString === colorBlackString ||
		foregroundString === colorWhiteString;
	const foregroundToUse = isPureBlackOrWhite
		? foreground.to("oklch").set("l", 0.5)
		: foreground;

	const result = adjustLightnessForTargetContrast(
		foregroundToUse,
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

	// If the desired contrast can be achieved we lighten or darken the color
	// in small steps until the desired contrast is reached.
	const maxIterations = 20;
	const step = 0.05;
	let iterations = 0;

	while (
		Math.abs(backgroundColor.contrastAPCA(foregroundColor)) < targetContrast &&
		iterations < maxIterations
	) {
		if (backgroundIsLight) {
			foregroundColor.darken(step);
		} else {
			foregroundColor.lighten(step);
		}

		foregroundColor = clampColorCoordinates(foregroundColor);

		iterations++;
	}

	return foregroundColor;
}

/**
 * Determines whether a color is light or dark based on its contrast with black
 * and white.
 */
function isLight(backgroundColor: Color) {
	const contrastWithBlack = backgroundColor.contrastAPCA(colorBlack);
	const contrastWithWhite = backgroundColor.contrastAPCA(colorWhite);

	return Math.abs(contrastWithBlack) > Math.abs(contrastWithWhite);
}

/**
 * Clamps the rgb coordinates of a color to the range 0-1.
 */
function clampColorCoordinates(color: Color) {
	const clone = color.to("srgb");

	const [r, g, b] = clone.coords;

	clone.set("r", clamp(r, 0, 1));
	clone.set("g", clamp(g, 0, 1));
	clone.set("b", clamp(b, 0, 1));

	return clone;
}
