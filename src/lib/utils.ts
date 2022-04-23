import { Rgba } from "../types/types";

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

export function getLuminance(color: Rgba): number {
	const [r, g, b] = [color.r, color.g, color.b].map(function (v) {
		v /= 255;
		return v <= 0.039_28 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	});
	return r! * 0.2126 + g! * 0.7152 + b! * 0.0722;
}

export function rgbaToRgb(
	rgbaString: string,
	backgroundRgbString: string
): string {
	const rgba = parseColor(rgbaString);
	const backgroundRgb = parseColor(backgroundRgbString);
	const rgb: Rgba = {
		r: Math.round((1 - rgba.a) * backgroundRgb.r + rgba.a * rgba.r),
		g: Math.round((1 - rgba.a) * backgroundRgb.g + rgba.a * rgba.g),
		b: Math.round((1 - rgba.a) * backgroundRgb.b + rgba.a * rgba.b),
		a: 1,
	};
	return stringFromRgba(rgb);
}

export function parseColor(color: string): Rgba {
	const [r, g, b, a] = color
		.replace(/[^\d.\s,]/g, "")
		.split(",")
		.map((v) => Number.parseFloat(v));

	return {
		r: r ?? 0,
		g: g ?? 0,
		b: b ?? 0,
		a: typeof a === "number" ? a : 1,
	};
}

function stringFromRgba(rgba: Rgba) {
	const colorType = rgba.a === 1 ? "rgb" : "rgba";
	return `${colorType}(${rgba.r}, ${rgba.g}, ${rgba.b}${
		rgba.a === 1 ? "" : ", rgba.a"
	})`;
}

// We assume colorString is in the format "rbg(r, g, b)" or "rbg(r, g, b, a)"
export function isRgb(colorString: string): boolean {
	return parseColor(colorString).a === 1;
}

export function getContrast(color1: string, color2: string) {
	const lum1 = getLuminance(parseColor(color1));
	const lum2 = getLuminance(parseColor(color2));
	const brightest = Math.max(lum1, lum2);
	const darkest = Math.min(lum1, lum2);
	return (brightest + 0.05) / (darkest + 0.05);
}
