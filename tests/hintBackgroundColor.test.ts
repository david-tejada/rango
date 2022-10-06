import puppeteer from "puppeteer";
import { getFileUrlPath } from "./utils/getFileUrlPath";
import { launchBrowser } from "./utils/launchBrowser";

let browser: puppeteer.Browser;
let page: puppeteer.Page;

describe("Background color", () => {
	beforeAll(async () => {
		({ browser, page } = await launchBrowser());
		await page.goto(getFileUrlPath("./test-pages/singleLink.html"));
		await page.waitForSelector(".rango-hint");
	});

	afterAll(async () => {
		await browser.close();
	});

	test("If the element doesn't have a background color set the background color of the hint will be white", async () => {
		const backgroundColor = await page.$eval(".rango-hint", (hint) => {
			return window.getComputedStyle(hint).backgroundColor;
		});

		expect(backgroundColor).toBe("rgb(255, 255, 255)");
	});

	test("If the element has an effective background color because of ancestors the hint will match that color", async () => {
		await page.goto(
			getFileUrlPath("./test-pages/effectiveBackgroundColor.html")
		);
		await page.waitForSelector(".rango-hint");

		const backgroundColor = await page.$eval(".rango-hint", (hint) => {
			return window.getComputedStyle(hint).backgroundColor;
		});

		expect(backgroundColor).toBe("rgb(0, 0, 128)");
	});

	test("If one of the ancestors changes color the hint will also change color", async () => {
		await page.evaluate(() => {
			const innerDiv: HTMLDivElement = document.querySelector("div > div")!;
			innerDiv.style.backgroundColor = "rgba(0, 0, 255, 0.25)";
		});

		const backgroundColor = await page.$eval(".rango-hint", (hint) => {
			return window.getComputedStyle(hint).backgroundColor;
		});

		expect(backgroundColor).toBe("rgb(0, 0, 64)");
	});
});
