import puppeteer from "puppeteer";
import { getFileUrlPath } from "./utils/getFileUrlPath";
import { launchBrowser } from "./utils/launchBrowser";

let browser: puppeteer.Browser;
let page: puppeteer.Page;

beforeAll(async () => {
	({ browser, page } = await launchBrowser());
	await page.setViewport({ width: 800, height: 600 });
});

beforeEach(async () => {
	await page.goto(getFileUrlPath("./test-pages/intersecting.html"));
	await page.waitForSelector(".rango-hint");
});

afterAll(async () => {
	await browser.close();
});

test("At the beginning only the hintables within the container and the rootMargins have hints", async () => {
	const hintsLength = await page.$$eval(".rango-hint", (hints) => hints.length);

	// 500px (container) + 300px (bottom rootMargin) = 800px / 18px = 44.44
	expect(hintsLength).toBe(45);
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

	await page.waitForSelector("#inside li#item46 .rango-hint-wrapper");

	const hintsLength = await page.$$eval(
		"#inside .rango-hint",
		(hints) => hints.length
	);

	expect(hintsLength).toBe(46);
});

test("As we scroll the document only the hintables within the container and the bottom and top root margin have hints", async () => {
	await page.evaluate(() => {
		// We scroll until #outside is just at the bounds of the viewport
		window.scrollBy(0, 1000 - document.documentElement.clientHeight);
	});

	await page.waitForSelector("#outside .rango-hint");

	const hintsLength = await page.$$eval(
		"#outside .rango-hint",
		(hints) => hints.length
	);

	// 300px / 18px = 16.67
	expect(hintsLength).toBe(17);
});
