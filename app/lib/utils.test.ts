import {
	parseColor,
	rgbaToRgb,
	getLuminance,
	isRgb,
	getContrast,
} from "./utils";

test("parseColor", () => {
	expect(parseColor("rgba(17, 45, 255, 0.04")).toEqual({
		r: 17,
		g: 45,
		b: 255,
		a: 0.04,
	});
	expect(parseColor("rgb(17, 45, 255")).toEqual({
		r: 17,
		g: 45,
		b: 255,
		a: 1,
	});
});

test("rgbaToRgb", () => {
	expect(rgbaToRgb("rgba(86, 86, 146, 0.5)", "rgb(139, 60, 60)")).toEqual(
		"rgb(113, 73, 103)"
	);
});

test("getColorLuma", () => {
	expect(getLuminance({ r: 0, g: 0, b: 0, a: 1 })).toBe(0);
	expect(getLuminance({ r: 255, g: 255, b: 255, a: 1 })).toBe(1);
});

test("isRgb", () => {
	expect(isRgb("rgb(4, 17, 207")).toBe(true);
	expect(isRgb("rgba(4, 17, 207, 1")).toBe(true);
	expect(isRgb("rgba(4, 17, 207, 0.8")).toBe(false);
});

test("getContrast", () => {
	expect(getContrast("rgb(0, 0, 0)", "rgb(30, 30, 30)")).toBeLessThan(4);
});
