import { parseColor, rgbaToRgb, getColorLuma } from "./utils";

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
	});
});

test("rgbaToRgb", () => {
	expect(
		rgbaToRgb({ r: 86, g: 86, b: 146, a: 0.5 }, { r: 139, g: 60, b: 60 })
	).toEqual({ r: 113, g: 73, b: 103 });
});

test("getColorLuma", () => {
	expect(getColorLuma({ r: 0, g: 0, b: 0 })).toBe(0);
	expect(getColorLuma({ r: 255, g: 255, b: 255 })).toBeCloseTo(255);
});
