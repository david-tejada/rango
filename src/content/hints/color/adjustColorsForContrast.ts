import type Color from "colorjs.io";

export function adjustColorsForContrast(
	foreground: Color,
	background: Color,
	targetRatio: number
): [Color, Color] {
	if (background.contrastWCAG21(foreground) >= targetRatio) {
		return [foreground, background];
	}

	const fg = foreground.to("oklch");
	const bg = background.to("oklch");

	const extremeL = findBetterContrastingLightness(bg, fg);

	// First check if pushing foreground to extreme is enough
	fg.set("l", extremeL);

	// If the contrast is enough we look for the point at which the contrast is
	// just over the desired targetRatio
	if (bg.contrastWCAG21(fg) >= targetRatio) {
		const fgAdjusted = adjustLightnessForTargetContrast(bg, fg, targetRatio);
		return [fgAdjusted, bg];
	}

	// If the contrast is not enough, we need to adjust the lightness of the
	// background color to make it more contrasting.
	const extremeBackgroundL = findBetterContrastingLightness(fg, bg);

	bg.set("l", extremeBackgroundL);

	if (bg.contrastWCAG21(fg) >= targetRatio) {
		const bgAdjusted = adjustLightnessForTargetContrast(fg, bg, targetRatio);
		return [fg, bgAdjusted];
	}

	return [fg, bg];
}

/**
 * Finds the lightness value that makes the contrast between the reference color
 * and the color to adjust the highest.
 *
 * @param referenceColor - The color to compare against.
 * @param colorToAdjust - The color to adjust.
 * @returns The lightness value that makes the contrast the highest.
 */
function findBetterContrastingLightness(
	referenceColor: Color,
	colorToAdjust: Color
) {
	const extremeLightnessValue = 0;
	const extremeDarknessValue = 1;

	const reference = referenceColor.to("oklch");
	const adjustable = colorToAdjust.to("oklch");

	const extremeLight = adjustable.clone().set("l", extremeLightnessValue);
	const extremeDark = adjustable.clone().set("l", extremeDarknessValue);

	const extremeLightContrast = reference.contrastWCAG21(extremeLight);
	const extremeDarkContrast = reference.contrastWCAG21(extremeDark);

	return extremeLightContrast > extremeDarkContrast
		? extremeLightnessValue
		: extremeDarknessValue;
}

function midpoint(a: number, b: number) {
	const large = Math.max(a, b);
	const small = Math.min(a, b);

	return (large - small) / 2 + small;
}

function adjustLightnessForTargetContrast(
	referenceColor: Color,
	colorToAdjust: Color,
	targetRatio: number
) {
	const reference = referenceColor.to("oklch");
	const adjustable = colorToAdjust.to("oklch");

	let opposite = reference.get("l");
	let valid = adjustable.get("l");

	const contrastTolerance = 1;
	const maxIterations = 10;
	let iteration = 0;

	while (iteration < maxIterations) {
		const mid = midpoint(opposite, valid);

		adjustable.set("l", mid);

		const midContrast = reference.contrastWCAG21(adjustable);

		if (
			midContrast >= targetRatio &&
			midContrast <= targetRatio + contrastTolerance
		) {
			console.log("found valid lightness", mid);
			valid = mid;
			break;
		}

		if (midContrast >= targetRatio) {
			valid = mid;
		} else {
			opposite = mid;
		}

		iteration++;
	}

	adjustable.set("l", valid);

	return adjustable;
}
