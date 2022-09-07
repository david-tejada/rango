import path from "node:path";
import puppeteer from "puppeteer";
// eslint-disable-next-line import/no-unassigned-import
import "./jest-matchers/toHaveHintIn";

// Using this because I can't find a way to make import.meta.url work in Jest
/* eslint-disable unicorn/prefer-module */
const EXTENSION_PATH = path.resolve(__dirname, "..", "dist-mv3");
const TEST_PAGE_DIR = path.resolve(
	__dirname,
	"test-pages",
	"getSuitableHintContainer.html"
);
const TEST_PAGE_PATH = new URL(TEST_PAGE_DIR, "file://").toString();
/* eslint-enable unicorn/prefer-module */

jest.setTimeout(30_000);

describe("The hints are placed in the appropriate DOM element", () => {
	let browser: puppeteer.Browser;
	let page: puppeteer.Page;

	beforeAll(async () => {
		browser = await puppeteer.launch({
			headless: false,
			devtools: true,
			args: [
				`--disable-extensions-except=${EXTENSION_PATH}`,
				`--load-extension=${EXTENSION_PATH}`,
			],
		});

		const pages = await browser.pages();
		page = pages[0] ?? (await browser.newPage());
		await page.goto(TEST_PAGE_PATH);
		await page.bringToFront();
		await page.waitForSelector(".rango-hint-wrapper");
	});

	afterAll(async () => {
		await browser.close();
	});

	test("The hint won't be placed in an element with overflow hidden and insufficient space", async () => {
		await expect("#clickable-1").not.toHaveHintIn("#skip-1", page);
		await expect("#clickable-1").toHaveHintIn("#target-1", page);
	});

	test("The hint will be placed in an element with overflow hidden but sufficient space", async () => {
		await expect("#clickable-2").toHaveHintIn("#target-2", page);
	});

	test("The hint for the summary element won't be placed inside the details element", async () => {
		await expect("#clickable-3").not.toHaveHintIn("#skip-3", page);
		await expect("#clickable-3").toHaveHintIn("#target-3", page);
	});

	test("The hint won't be placed beyond its scroll container", async () => {
		await expect("#clickable-4").toHaveHintIn("#target-4", page);
		await expect("#clickable-5").not.toHaveHintIn("#skip-5", page);
		await expect("#clickable-5").toHaveHintIn("#target-5", page);
	});

	test("The hint won't be placed beyond a fixed container", async () => {
		await expect("#clickable-7").toHaveHintIn("#target-7", page);
		await expect("#clickable-8").not.toHaveHintIn("#skip-8", page);
		await expect("#clickable-8").toHaveHintIn("#target-8", page);
	});

	test("The hint won't be placed beyond a sticky container", async () => {
		await expect("#clickable-9").toHaveHintIn("#target-9", page);
	});
});
