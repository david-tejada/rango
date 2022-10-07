import puppeteer from "puppeteer";
import { launchBrowser } from "./utils/launchBrowser";
import { getFileUrlPath } from "./utils/getFileUrlPath";
import {
	rangoCommandWithoutTarget,
	rangoCommandWithTarget,
} from "./utils/rangoCommands";
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

	let hint: string | undefined;

	if (getHintFrom) {
		// We need to insert a prudent wait here so that the hints have had time to
		// update after the initial setup scrolling
		await sleep(100);
		await page.waitForSelector(`${getHintFrom} a[data-hint]`);
		hint = await page.$eval(
			`${getHintFrom} a[data-hint]`,
			(element) => (element as HTMLAnchorElement).dataset["hint"]
		);
	}

	await (hint
		? rangoCommandWithTarget(action, [hint], arg)
		: rangoCommandWithoutTarget(action, arg));

	// We insert a wait to make sure the command has enough time to be executed
	await sleep(250);

	const containerHeight = await $container.evaluate(
		(element) => element.clientHeight
	);
	const containerWidth = await $container.evaluate(
		(element) => element.clientWidth
	);

	const scrollLeft = await $container.evaluate((element) => element.scrollLeft);
	const scrollTop = await $container.evaluate((element) => element.scrollTop);

	return {
		scrolledRightFactor: (scrollLeft - scrollLeftBefore) / containerWidth,
		scrolledDownFactor: (scrollTop - scrollTopBefore) / containerHeight,
	};
}

beforeAll(async () => {
	({ browser, page } = await launchBrowser());
});

afterAll(async () => {
	await browser.close();
});

describe("Vertical", () => {
	beforeAll(async () => {
		await page.goto(getFileUrlPath("./test-pages/verticalScrolling.html"));
	});

	describe("DOWN", () => {
		describe("Default factor (0.66)", () => {
			test("At element", async () => {
				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollDownAtElement",
						getHintFrom: ".scroll",
						shouldScroll: ".scroll",
					}
				);

				expect(scrolledDownFactor).toBeCloseTo(0.66);
			});

			test("At element again", async () => {
				// We first scroll once so that it can store the last scrolled container
				await executeCommandAndGetScrolledFactor({
					action: "scrollDownAtElement",
					getHintFrom: ".scroll",
					shouldScroll: ".scroll",
				});

				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollDownAtElement",
						shouldScroll: ".scroll",
					}
				);

				expect(scrolledDownFactor).toBeCloseTo(0.66);
			});

			test("At element (page scroll)", async () => {
				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollDownAtElement",
						getHintFrom: ".no-scroll",
						shouldScroll: "html",
					}
				);

				expect(scrolledDownFactor).toBeCloseTo(0.66);
			});

			test("Page", async () => {
				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollDownPage",
						shouldScroll: "html",
					}
				);

				expect(scrolledDownFactor).toBeCloseTo(0.66);
			});
		});

		describe("Custom factor", () => {
			test("At element", async () => {
				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollDownAtElement",
						getHintFrom: ".scroll",
						shouldScroll: ".scroll",
						arg: 0.4,
					}
				);

				expect(scrolledDownFactor).toBeCloseTo(0.4);
			});

			test("At element again", async () => {
				// We first scroll once so that it can store the last scrolled container
				await executeCommandAndGetScrolledFactor({
					action: "scrollDownAtElement",
					getHintFrom: ".scroll",
					shouldScroll: ".scroll",
					arg: 0.6,
				});

				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollDownAtElement",
						shouldScroll: ".scroll",
					}
				);

				expect(scrolledDownFactor).toBeCloseTo(0.6);
			});

			test("At element (page scroll)", async () => {
				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollDownAtElement",
						getHintFrom: ".no-scroll",
						shouldScroll: "html",
						arg: 1.8,
					}
				);

				await sleep(500);
				await page.$eval("html", (element) => element.scrollTop);

				expect(scrolledDownFactor).toBeCloseTo(1.8);
			});

			test("Page", async () => {
				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollDownPage",
						shouldScroll: "html",
						arg: 0.7,
					}
				);

				expect(scrolledDownFactor).toBeCloseTo(0.7);
			});
		});
	});

	describe("UP", () => {
		describe("Default factor (0.66)", () => {
			test("At element", async () => {
				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollUpAtElement",
						getHintFrom: ".scroll",
						shouldScroll: ".scroll",
					}
				);
				expect(scrolledDownFactor).toBeCloseTo(-0.66);
			});

			test("At element again", async () => {
				// We first scroll once so that it can store the last scrolled container
				await executeCommandAndGetScrolledFactor({
					action: "scrollUpAtElement",
					getHintFrom: ".scroll",
					shouldScroll: ".scroll",
				});

				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollUpAtElement",
						shouldScroll: ".scroll",
					}
				);

				expect(scrolledDownFactor).toBeCloseTo(-0.66);
			});

			test("At element, (page scroll)", async () => {
				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollUpAtElement",
						getHintFrom: ".no-scroll",
						shouldScroll: "html",
					}
				);
				expect(scrolledDownFactor).toBeCloseTo(-0.66);
			});

			test("Page", async () => {
				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollUpPage",
						shouldScroll: "html",
					}
				);

				expect(scrolledDownFactor).toBeCloseTo(-0.66);
			});
		});

		describe("Custom factor", () => {
			test("At element", async () => {
				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollUpAtElement",
						getHintFrom: ".scroll",
						shouldScroll: ".scroll",
						arg: 2,
					}
				);
				expect(scrolledDownFactor).toBeCloseTo(-2);
			});

			test("At element again", async () => {
				// We first scroll once so that it can store the last scrolled container
				await executeCommandAndGetScrolledFactor({
					action: "scrollUpAtElement",
					getHintFrom: ".scroll",
					shouldScroll: ".scroll",
					arg: 2,
				});

				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollUpAtElement",
						shouldScroll: ".scroll",
					}
				);

				expect(scrolledDownFactor).toBeCloseTo(-2);
			});

			test("At element (page scroll)", async () => {
				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollUpAtElement",
						getHintFrom: ".no-scroll",
						shouldScroll: "html",
						arg: 1.5,
					}
				);
				expect(scrolledDownFactor).toBeCloseTo(-1.5);
			});

			test("Page", async () => {
				const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor(
					{
						action: "scrollUpPage",
						shouldScroll: "html",
						arg: 2,
					}
				);

				expect(scrolledDownFactor).toBeCloseTo(-2);
			});
		});
	});
});

describe("Horizontal", () => {
	beforeAll(async () => {
		await page.goto(getFileUrlPath("./test-pages/horizontalScrolling.html"));
		await page.waitForSelector(".rango-hint");
	});

	describe("RIGHT", () => {
		describe("Default factor (0.66)", () => {
			test("At element", async () => {
				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollRightAtElement",
						getHintFrom: ".scroll",
						shouldScroll: ".scroll",
					});

				expect(scrolledRightFactor).toBeCloseTo(0.66);
			});

			test("At element again", async () => {
				// We first scroll once so that it can store the last scrolled container
				await executeCommandAndGetScrolledFactor({
					action: "scrollRightAtElement",
					getHintFrom: ".scroll",
					shouldScroll: ".scroll",
				});

				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollRightAtElement",
						shouldScroll: ".scroll",
					});

				expect(scrolledRightFactor).toBeCloseTo(0.66);
			});

			test("At element (page scroll)", async () => {
				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollRightAtElement",
						getHintFrom: ".no-scroll",
						shouldScroll: "html",
					});

				expect(scrolledRightFactor).toBeCloseTo(0.66);
			});

			test("Page", async () => {
				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollRightPage",
						shouldScroll: "html",
					});

				expect(scrolledRightFactor).toBeCloseTo(0.66);
			});
		});

		describe("Custom factor", () => {
			test("At element", async () => {
				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollRightAtElement",
						getHintFrom: ".scroll",
						shouldScroll: ".scroll",
						arg: 0.4,
					});

				expect(scrolledRightFactor).toBeCloseTo(0.4);
			});

			test("At element again", async () => {
				// We first scroll once so that it can store the last scrolled container
				await executeCommandAndGetScrolledFactor({
					action: "scrollRightAtElement",
					getHintFrom: ".scroll",
					shouldScroll: ".scroll",
					arg: 0.6,
				});

				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollRightAtElement",
						shouldScroll: ".scroll",
					});

				expect(scrolledRightFactor).toBeCloseTo(0.6);
			});

			test("At element (page scroll)", async () => {
				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollRightAtElement",
						getHintFrom: ".no-scroll",
						shouldScroll: "html",
						arg: 1.8,
					});

				expect(scrolledRightFactor).toBeCloseTo(1.8);
			});

			test("Page", async () => {
				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollRightPage",
						shouldScroll: "html",
						arg: 0.7,
					});

				expect(scrolledRightFactor).toBeCloseTo(0.7);
			});
		});
	});

	describe("LEFT", () => {
		describe("Default factor (0.66)", () => {
			test("At element", async () => {
				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollLeftAtElement",
						getHintFrom: ".scroll",
						shouldScroll: ".scroll",
					});
				expect(scrolledRightFactor).toBeCloseTo(-0.66);
			});

			test("At element again", async () => {
				// We first scroll once so that it can store the last scrolled container
				await executeCommandAndGetScrolledFactor({
					action: "scrollLeftAtElement",
					getHintFrom: ".scroll",
					shouldScroll: ".scroll",
				});

				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollLeftAtElement",
						shouldScroll: ".scroll",
					});

				expect(scrolledRightFactor).toBeCloseTo(-0.66);
			});

			test("At element, (page scroll)", async () => {
				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollLeftAtElement",
						getHintFrom: ".no-scroll",
						shouldScroll: "html",
					});
				expect(scrolledRightFactor).toBeCloseTo(-0.66);
			});

			test("Page", async () => {
				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollLeftPage",
						shouldScroll: "html",
					});

				expect(scrolledRightFactor).toBeCloseTo(-0.66);
			});
		});

		describe("Custom factor", () => {
			test("At element", async () => {
				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollLeftAtElement",
						getHintFrom: ".scroll",
						shouldScroll: ".scroll",
						arg: 2,
					});
				expect(scrolledRightFactor).toBeCloseTo(-2);
			});

			test("At element again", async () => {
				// We first scroll once so that it can store the last scrolled container
				await executeCommandAndGetScrolledFactor({
					action: "scrollLeftAtElement",
					getHintFrom: ".scroll",
					shouldScroll: ".scroll",
					arg: 2,
				});

				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollLeftAtElement",
						shouldScroll: ".scroll",
					});

				expect(scrolledRightFactor).toBeCloseTo(-2);
			});

			test("At element (page scroll)", async () => {
				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollLeftAtElement",
						getHintFrom: ".no-scroll",
						shouldScroll: "html",
						arg: 1.5,
					});
				expect(scrolledRightFactor).toBeCloseTo(-1.5);
			});

			test("Page", async () => {
				const { scrolledRightFactor } =
					await executeCommandAndGetScrolledFactor({
						action: "scrollLeftPage",
						shouldScroll: "html",
						arg: 2,
					});

				expect(scrolledRightFactor).toBeCloseTo(-2);
			});
		});
	});
});
