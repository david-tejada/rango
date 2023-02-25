import { getFileUrlPath } from "./utils/getFileUrlPath";

beforeAll(async () => {
	await page.setViewport({ width: 800, height: 600 });
});

beforeEach(async () => {
	await page.goto(getFileUrlPath("./test-pages/intersecting.html"));
	await page.waitForSelector(".rango-hint");
});

test("At the beginning only the hintables within the container and the rootMargins have hints", async () => {
	const hintsLength = await page.$$eval(".rango-hint", (hints) => hints.length);

	// #inside: 500px (container) + 1000px (bottom rootMargin) = 1500px / 18px = 83.33
	// #outside: 600px (bottom rootMargin) = 600px / 18px = 33.33
	expect(hintsLength).toBe(Math.ceil(1500 / 18) + Math.ceil(600 / 18));
});

test("Scroll containers out of the viewport + rootMargin won't have any hints in them", async () => {
	const hintsLength = await page.$$eval(
		".outside .rango-hint",
		(hints) => hints.length
	);

	expect(hintsLength).toBe(0);
});

test("As we scroll the container only the hintables within the container and the bottom and top root margin have hints", async () => {
	await page.evaluate(() => {
		document.querySelector("#inside")?.scrollBy(0, 18);
	});

	await page.waitForSelector("#inside li#item84 .rango-hint");

	const hintsLength = await page.$$eval(
		"#inside .rango-hint",
		(hints) => hints.length
	);

	// 500px (container) + 1000px (bottom rootMargin) = 1500px / 18px
	expect(hintsLength).toBe(Math.ceil(1500 / 18));
});

test("As we scroll the document only the hintables within the container and the bottom and top root margin have hints", async () => {
	await page.evaluate(() => {
		// We scroll until #outside is just at the bounds of the viewport
		window.scrollBy(0, 1000 - document.documentElement.clientHeight);
	});

	await page.waitForSelector("#outside li#item100 .rango-hint");

	const hintsLength = await page.$$eval(
		"#outside .rango-hint",
		(hints) => hints.length
	);

	// 1000px / 18px = 55.56
	expect(hintsLength).toBe(Math.ceil(1000 / 18));
});
