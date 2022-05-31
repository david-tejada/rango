import { Rgba } from "../typing/types";

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

export function getTintOrShade(color: string, factor: number): string {
	const c = parseColor(color);
	let red;
	let green;
	let blue;

	if (factor < 0) {
		red = c.r * (1 - factor);
		green = c.g * (1 - factor);
		blue = c.b * (1 - factor);
	} else {
		red = c.r + (255 - c.r) * factor;
		green = c.g + (255 - c.g) * factor;
		blue = c.b + (255 - c.b) * factor;
	}

	return `rgb(${red}, ${green},${blue})`;
}
