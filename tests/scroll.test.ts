import puppeteer from "puppeteer";
import { launchBrowser } from "./utils/launchBrowser";
import { getFileUrlPath } from "./utils/getFileUrlPath";
import {
	rangoCommandWithoutTarget,
	rangoCommandWithTarget,
} from "./utils/rangoCommands";
import { getAttribute } from "./utils/puppeteerHelpers";
import { sleep } from "./utils/testHelpers";

let page: puppeteer.Page;
let browser: puppeteer.Browser;

/**
 * This function executes a rango command and returns the factor by which the
 * element that matches the selector "shouldScroll" scrolled. We automatically
 * get the hint from the container with the selector "getHintFrom"
 */
async function executeCommandAndGetScrolledFactor(options: {
	action: string;
	getHintFrom?: string;
	arg?: number;
	shouldScroll: string;
}) {
	const { action, shouldScroll, getHintFrom, arg } = options;
	const $container = await page.$(shouldScroll);

	if (!$container) {
		throw new Error("No container found");
	}

	// We scroll the container to the middle so it has room to scroll in every direction
	await $container.evaluate((element) => {
		element.scrollIntoView({ block: "center" });
		element.scrollTo(
			(element.scrollWidth - element.clientWidth) / 2,
			(element.scrollHeight - element.clientHeight) / 2
		);
	});

	// We store the values to compare before and after
	const scrollLeftBefore = await $container.evaluate(
		(element) => element.scrollLeft
	);
	const scrollTopBefore = await $container.evaluate(
		(element) => element.scrollTop
	);

	let hint;

	if (getHintFrom) {
		// We need to insert a prudent wait here so that the hints have had time to
		// update after the initial setup scrolling
		await sleep(100);
		await page.waitForSelector(`${getHintFrom} a[data-hint]`);
		hint = await getAttribute(`${getHintFrom} a[data-hint]`, "data-hint", page);
	}

	await (hint
		? rangoCommandWithTarget(action, [hint], arg)
		: rangoCommandWithoutTarget(action, arg));

	const containerHeight = await $container.evaluate(
		(element) => element.clientHeight
	);
	const containerWidth = await $container.evaluate(
		(element) => element.clientWidth
	);

	const scrollLeft = await $container.evaluate((element) => element.scrollLeft);
	const scrollTop = await $container.evaluate((element) => element.scrollTop);

	return {
		scrolledLeftFactor: (scrollLeft - scrollLeftBefore) / containerWidth,
		scrolledTopFactor: (scrollTop - scrollTopBefore) / containerHeight,
	};
}

beforeAll(async () => {
	({ browser, page } = await launchBrowser());
	await page.goto(getFileUrlPath("./test-pages/verticalScrolling.html"));
});

afterAll(async () => {
	await browser.close();
});

describe("DOWN", () => {
	describe("Default factor (0.66)", () => {
		test("At element", async () => {
			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollDownAtElement",
				getHintFrom: ".scroll",
				shouldScroll: ".scroll",
			});

			expect(scrolledTopFactor).toBe(0.66);
		});

		test("At element again", async () => {
			// We first scroll once so that it can store the last scrolled container
			await executeCommandAndGetScrolledFactor({
				action: "scrollDownAtElement",
				getHintFrom: ".scroll",
				shouldScroll: ".scroll",
			});

			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollDownAtElement",
				shouldScroll: ".scroll",
			});

			expect(scrolledTopFactor).toBe(0.66);
		});

		test("At element (page scroll)", async () => {
			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollDownAtElement",
				getHintFrom: ".no-scroll",
				shouldScroll: "html",
			});

			expect(scrolledTopFactor).toBe(0.66);
		});

		test("Page", async () => {
			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollDownPage",
				shouldScroll: "html",
			});

			expect(scrolledTopFactor).toBe(0.66);
		});
	});

	describe("Custom factor", () => {
		test("At element", async () => {
			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollDownAtElement",
				getHintFrom: ".scroll",
				shouldScroll: ".scroll",
				arg: 0.4,
			});

			expect(scrolledTopFactor).toBe(0.4);
		});

		test("At element again", async () => {
			// We first scroll once so that it can store the last scrolled container
			await executeCommandAndGetScrolledFactor({
				action: "scrollDownAtElement",
				getHintFrom: ".scroll",
				shouldScroll: ".scroll",
				arg: 0.6,
			});

			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollDownAtElement",
				shouldScroll: ".scroll",
			});

			expect(scrolledTopFactor).toBe(0.6);
		});

		test("At element (page scroll)", async () => {
			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollDownAtElement",
				getHintFrom: ".no-scroll",
				shouldScroll: "html",
				arg: 1.8,
			});

			await sleep(500);
			await page.$eval("html", (element) => element.scrollTop);

			expect(scrolledTopFactor).toBe(1.8);
		});

		test("Page", async () => {
			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollDownPage",
				shouldScroll: "html",
				arg: 0.7,
			});

			expect(scrolledTopFactor).toBe(0.7);
		});
	});
});

describe("UP", () => {
	describe("Default factor (0.66)", () => {
		test("At element", async () => {
			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollUpAtElement",
				getHintFrom: ".scroll",
				shouldScroll: ".scroll",
			});
			expect(scrolledTopFactor).toBe(-0.66);
		});

		test("At element again", async () => {
			// We first scroll once so that it can store the last scrolled container
			await executeCommandAndGetScrolledFactor({
				action: "scrollUpAtElement",
				getHintFrom: ".scroll",
				shouldScroll: ".scroll",
			});

			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollUpAtElement",
				shouldScroll: ".scroll",
			});

			expect(scrolledTopFactor).toBe(-0.66);
		});

		test("At element, (page scroll)", async () => {
			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollUpAtElement",
				getHintFrom: ".no-scroll",
				shouldScroll: "html",
			});
			expect(scrolledTopFactor).toBe(-0.66);
		});

		test("Page", async () => {
			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollUpPage",
				shouldScroll: "html",
			});

			expect(scrolledTopFactor).toBe(-0.66);
		});
	});

	describe("Custom factor", () => {
		test("At element", async () => {
			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollUpAtElement",
				getHintFrom: ".scroll",
				shouldScroll: ".scroll",
				arg: 2,
			});
			expect(scrolledTopFactor).toBe(-2);
		});

		test("At element again", async () => {
			// We first scroll once so that it can store the last scrolled container
			await executeCommandAndGetScrolledFactor({
				action: "scrollUpAtElement",
				getHintFrom: ".scroll",
				shouldScroll: ".scroll",
				arg: 2,
			});

			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollUpAtElement",
				shouldScroll: ".scroll",
			});

			expect(scrolledTopFactor).toBe(-2);
		});

		test("At element (page scroll)", async () => {
			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollUpAtElement",
				getHintFrom: ".no-scroll",
				shouldScroll: "html",
				arg: 1.5,
			});
			expect(scrolledTopFactor).toBe(-1.5);
		});

		test("Page", async () => {
			const { scrolledTopFactor } = await executeCommandAndGetScrolledFactor({
				action: "scrollUpPage",
				shouldScroll: "html",
				arg: 2,
			});

			expect(scrolledTopFactor).toBe(-2);
		});
	});
});
