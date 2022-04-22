import { RGBA, RGB } from "../types/types";

export function getLettersFromNumber(hintNumber: number): string {
	const codePointLowerA = 97;
	const lettersNumbers: number[] = [hintNumber];
	let result = "";
	let div: number;
	let sp = 0;

	// At the end of this while loop we will have an array with the numbers of the letters
	// from 0 (a) to 25 (z) in reversed order, for example: 35 -> [9, 0] -> ["j", "a"] -> "aj"
	while (sp < lettersNumbers.length) {
		if (lettersNumbers[sp]! > 25) {
			div = Math.floor(lettersNumbers[sp]! / 26);
			lettersNumbers[sp + 1] = div - 1;
			lettersNumbers[sp] %= 26;
		}

		sp += 1;
	}

	for (const letterNumber of lettersNumbers) {
		result = String.fromCodePoint(codePointLowerA + letterNumber) + result;
	}

	return result;
}

export function getColorLuma(color: RGB): number {
	// The resulting luma value range is 0..255, where 0 is the darkest and 255
	// is the lightest. Values greater than 128 are considered light.
	return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
}

export function rgbaToRgb(rgba: RGBA, backgroundRgb: RGB): RGB {
	const rgb: RGB = {
		r: Math.round((1 - rgba.a) * backgroundRgb.r + rgba.a * rgba.r),
		g: Math.round((1 - rgba.a) * backgroundRgb.g + rgba.a * rgba.g),
		b: Math.round((1 - rgba.a) * backgroundRgb.b + rgba.a * rgba.b),
	};
	return rgb;
}

export function parseColor(color: string): RGBA | RGB | undefined {
	const [r, g, b, a] = color
		.replace(/[^\d.\s,]/g, "")
		.split(",")
		.map((v) => Number.parseFloat(v));

	if (r && g && b && a) {
		return {
			r,
			g,
			b,
			a,
		};
	}

	if (r && g && b) {
		return {
			r,
			g,
			b,
		};
	}

	return undefined;
}
