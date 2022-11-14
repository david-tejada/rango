import puppeteer from "puppeteer";
import { launchBrowser } from "./utils/launchBrowser";
import { getFileUrlPath } from "./utils/getFileUrlPath";
import {
	rangoCommandWithoutTarget,
	rangoCommandWithTarget,
} from "./utils/rangoCommands";
import { sleep } from "./utils/testHelpers";

function getHint(element: Element) {
	if (element instanceof HTMLElement) {
		const hint = element.dataset["hint"];
		if (!hint) {
			throw new TypeError("Element doesn't have hint attached");
		}

		return hint;
	}

	throw new TypeError("Element doesn't have dataset property");
}

function getCenter(element: Element) {
	const { top, height } = element.getBoundingClientRect();
	return top + height / 2;
}

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
		// update after the initial scrolling setup
		await sleep(300);
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
	await sleep(300);

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

				await sleep(300);
				// eslint-disable-next-line max-nested-callbacks
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

describe("Snap", () => {
	beforeAll(async () => {
		await page.goto(getFileUrlPath("./test-pages/snapScrolling.html"));
	});
	beforeEach(async () => {
		await page.evaluate(() => {
			document.documentElement.scrollTo(0, 0);
			document.querySelector(".scroll")?.scrollTo(0, 0);
		});
		await sleep(300);
	});
	describe("Top", () => {
		test("Scroll container", async () => {
			await page.waitForSelector("[data-hint]");
			// We get the second hinted element as the first is already at the top
			const $target = await page.$(".scroll li + li > a[data-hint]");
			const hint = await $target!.evaluate(getHint);
			await rangoCommandWithTarget("scrollElementToTop", [hint]);
			await sleep(300);

			const top = await $target?.evaluate(
				(element) => element.getBoundingClientRect().top
			);
			const cTop = await page.$eval(
				".scroll",
				(element) => element.getBoundingClientRect().top
			);

			expect(top).toBeCloseTo(cTop);
		});

		test("Scroll container with sticky header", async () => {
			await page.waitForSelector("[data-hint]");
			// We get the second hinted element as the first is already at the top
			const $target = await page.$(".scroll-sticky li + li > a[data-hint]");
			const hint = await $target!.evaluate(getHint);
			await rangoCommandWithTarget("scrollElementToTop", [hint]);
			await sleep(300);

			const top = await $target?.evaluate(
				(element) => element.getBoundingClientRect().top
			);
			const stickyBottom = await page.$eval(
				".sticky.bottom",
				(element) => element.getBoundingClientRect().bottom
			);

			expect(top).toBeCloseTo(stickyBottom);
		});

		test("Page", async () => {
			await page.waitForSelector("[data-hint]");
			const $target = await page.$(".no-scroll a[data-hint]");
			const hint = await $target!.evaluate(
				(element) => (element as HTMLAnchorElement).dataset["hint"]
			);
			await rangoCommandWithTarget("scrollElementToTop", [hint!]);
			await sleep(300);

			const top = await $target?.evaluate(
				(element) => element.getBoundingClientRect().top
			);

			expect(top).toBeCloseTo(0);
		});

		test("Page with sticky header", async () => {
			await page.$eval("h1", (element) => {
				element.style.display = "block";
			});
			await page.waitForSelector("[data-hint]");
			const $target = await page.$(".no-scroll a[data-hint]");
			const hint = await $target!.evaluate(
				(element) => (element as HTMLAnchorElement).dataset["hint"]
			);
			await rangoCommandWithTarget("scrollElementToTop", [hint!]);
			await sleep(300);

			const top = await $target?.evaluate(
				(element) => element.getBoundingClientRect().top
			);

			const stickyBottom = await page.$eval(
				"h1",
				(element) => element.getBoundingClientRect().bottom
			);

			await page.$eval("h1", (element) => {
				element.style.display = "none";
			});

			expect(top).toBeCloseTo(stickyBottom);
		});
	});

	describe("Center", () => {
		test("Scroll container", async () => {
			await page.waitForSelector("[data-hint]");
			const $target = await page.$("li:nth-child(7) a[data-hint]");
			const hint = await $target!.evaluate(getHint);
			await rangoCommandWithTarget("scrollElementToCenter", [hint]);
			await sleep(300);

			const center = await $target?.evaluate(getCenter);
			const cCenter = await page.$eval(".scroll", getCenter);

			expect(center).toBeCloseTo(cCenter, 0);
		});

		test("Page", async () => {
			await page.waitForSelector("[data-hint]");
			// Here we have to select an element that's able to scroll to the center
			const $target = await page.$(".no-scroll li:nth-child(15) a[data-hint]");
			const hint = await $target!.evaluate(getHint);
			await rangoCommandWithTarget("scrollElementToCenter", [hint]);
			await sleep(300);

			const center = await $target?.evaluate(getCenter);
			const cCenter = await page.evaluate(() => {
				return document.documentElement.clientHeight / 2;
			});

			expect(center).toBeCloseTo(cCenter, 0);
		});
	});

	describe("Bottom", () => {
		test("Scroll container", async () => {
			await page.waitForSelector("[data-hint]");
			const $target = await page.$(".scroll li:nth-child(10) a[data-hint]");
			const hint = await $target!.evaluate(getHint);
			await rangoCommandWithTarget("scrollElementToBottom", [hint]);
			await sleep(300);

			const bottom = await $target?.evaluate(
				(element) => element.getBoundingClientRect().bottom
			);
			const cBottom = await page.$eval(
				".scroll",
				(element) => element.getBoundingClientRect().bottom
			);

			expect(bottom).toBeCloseTo(cBottom);
		});

		test("Page", async () => {
			await page.waitForSelector("[data-hint]");
			// Here we have to select an element that's able to scroll to the bottom
			const $target = await page.$(".no-scroll li:nth-child(35) a[data-hint]");
			const hint = await $target!.evaluate(getHint);
			await rangoCommandWithTarget("scrollElementToBottom", [hint]);
			await sleep(300);

			const bottom = await $target?.evaluate(
				(element) => element.getBoundingClientRect().bottom
			);
			const cBottom = await page.evaluate(() => {
				return document.documentElement.clientHeight;
			});

			expect(bottom).toBeCloseTo(cBottom);
		});
	});
});

describe("Find scrolling container", () => {
	beforeAll(async () => {
		await page.goto(getFileUrlPath("./test-pages/scrollingContainers.html"));
	});

	test("Left aside", async () => {
		const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor({
			action: "scrollDownLeftAside",
			shouldScroll: ".left-aside",
		});

		expect(scrolledDownFactor).toBeCloseTo(0.66);
	});

	test("Main content (center)", async () => {
		const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor({
			action: "scrollDownPage",
			shouldScroll: ".main",
		});

		expect(scrolledDownFactor).toBeCloseTo(0.66);
	});

	test("Right aside", async () => {
		const { scrolledDownFactor } = await executeCommandAndGetScrolledFactor({
			action: "scrollDownRightAside",
			shouldScroll: ".right-aside",
		});

		expect(scrolledDownFactor).toBeCloseTo(0.66);
	});
});
