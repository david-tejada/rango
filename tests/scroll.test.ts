/* eslint-disable max-nested-callbacks */
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

async function getActionableHint(containerSelector: string, top = true) {
	await page.waitForSelector(`${containerSelector} [data-hint]`);
	const $container = await page.$(containerSelector);

	const {
		top: cTop,
		right: cRight,
		bottom: cBottom,
		left: cLeft,
	} = await $container!.evaluate((container) => {
		const { top, right, bottom, left } = container.getBoundingClientRect();
		if (window.getComputedStyle(container).overflow === "visible") {
			return {
				top: 0,
				right: document.documentElement.clientWidth,
				bottom: document.documentElement.clientHeight,
				left: 0,
			};
		}

		return { top, right, bottom, left };
	});

	const $$nodes = await page.$$(`${containerSelector} a[data-hint]`);
	const $$visible = [];
	for (const $node of $$nodes) {
		// eslint-disable-next-line no-await-in-loop
		const visible = await $node.evaluate(
			(node, cTop, cRight, cBottom, cLeft) => {
				const { top, right, bottom, left } = node.getBoundingClientRect();
				return (
					top >= cTop && right <= cRight && bottom <= cBottom && left >= cLeft
				);
			},
			cTop,
			cRight,
			cBottom,
			cLeft
		);

		if (visible) $$visible.push($node);
	}

	const $target = top ? $$visible[0] : $$visible[$$visible.length - 1];

	return $target!.evaluate(getHint);
}

async function waitForScroll(
	containerSelector: string,
	previousScrollTop?: number,
	previousScrollLeft?: number
) {
	// We wait for an scroll event in container.
	// https://stackoverflow.com/a/70789108
	return page.$eval(
		containerSelector,
		async (container, previousScrollTop, previousScrollLeft) => {
			// If we scroll the html element it's actually the window object that
			// receives the scroll event
			const eventTarget =
				container === document.documentElement ? window : container;

			await new Promise<void>((resolve) => {
				const listener = () => {
					eventTarget.removeEventListener("scroll", listener);
					resolve();
				};

				eventTarget.addEventListener("scroll", listener);
				// It is possible that between calling this function and adding the
				// event listener the container scrolls so we need to check if it has
				// already scrolled
				if (
					previousScrollTop !== undefined &&
					previousScrollLeft !== undefined &&
					(container.scrollTop !== previousScrollTop ||
						container.scrollLeft !== previousScrollLeft)
				) {
					resolve();
				}
			});
		},
		previousScrollTop,
		previousScrollLeft
	);
}

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
		hint = await getActionableHint(getHintFrom);
	}

	await (hint
		? rangoCommandWithTarget(action, [hint], arg)
		: rangoCommandWithoutTarget(action, arg));

	let { clientHeight, clientWidth, scrollLeft, scrollTop } =
		await $container.evaluate((container) => {
			const { clientHeight, clientWidth, scrollLeft, scrollTop } = container;
			return { clientHeight, clientWidth, scrollLeft, scrollTop };
		});

	if (scrollLeftBefore === scrollLeft && scrollTopBefore === scrollTop) {
		await waitForScroll(shouldScroll, scrollTopBefore, scrollLeftBefore);
		({ scrollLeft, scrollTop } = await $container.evaluate((container) => {
			const { scrollLeft, scrollTop } = container;
			return { scrollLeft, scrollTop };
		}));
	}

	return {
		scrolledRightFactor: (scrollLeft - scrollLeftBefore) / clientWidth,
		scrolledDownFactor: (scrollTop - scrollTopBefore) / clientHeight,
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
		await page.waitForSelector(".rango-hint");
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

			test("At element (page scroll)", async () => {
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

			test("At element (page scroll)", async () => {
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
		await page.waitForSelector(".rango-hint");
	});
	beforeEach(async () => {
		await page.evaluate(() => {
			document.documentElement.scrollTo(0, 0);
			document.querySelector(".scroll")?.scrollTo(0, 0);
		});
	});
	describe("Top", () => {
		test("Scroll container", async () => {
			const hint = await getActionableHint(".scroll", false);
			await rangoCommandWithTarget("scrollElementToTop", [hint]);
			await waitForScroll(".scroll");

			const top = await page.$eval(
				`a[data-hint='${hint}']`,
				(element) => element.getBoundingClientRect().top
			);
			const cTop = await page.$eval(
				".scroll",
				(element) => element.getBoundingClientRect().top
			);

			expect(top).toBeCloseTo(cTop);
		});

		test("Scroll container with sticky header", async () => {
			const hint = await getActionableHint(".scroll-sticky", false);
			await rangoCommandWithTarget("scrollElementToTop", [hint]);
			await waitForScroll(".scroll-sticky");

			const top = await page.$eval(
				`a[data-hint='${hint}']`,
				(element) => element.getBoundingClientRect().top
			);
			const stickyBottom = await page.$eval(
				".sticky.bottom",
				(element) => element.getBoundingClientRect().bottom
			);

			expect(top).toBeCloseTo(stickyBottom);
		});

		test("Page", async () => {
			const hint = await getActionableHint(".no-scroll", false);
			await rangoCommandWithTarget("scrollElementToTop", [hint]);
			await waitForScroll("html");

			const top = await page.$eval(
				`a[data-hint='${hint}']`,
				(element) => element.getBoundingClientRect().top
			);

			expect(top).toBeCloseTo(0);
		});

		test("Page with sticky header", async () => {
			await page.$eval("h1", (element) => {
				element.style.display = "block";
			});
			const hint = await getActionableHint(".no-scroll", false);
			await rangoCommandWithTarget("scrollElementToTop", [hint]);
			await waitForScroll("html");

			const top = await page.$eval(
				`a[data-hint='${hint}']`,
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
			const hint = await getActionableHint(".scroll", false);

			await rangoCommandWithTarget("scrollElementToCenter", [hint]);
			await waitForScroll(".scroll");

			const center = await page.$eval(`a[data-hint='${hint}']`, getCenter);
			const cCenter = await page.$eval(".scroll", getCenter);

			expect(center).toBeCloseTo(cCenter, 0);
		});

		test("Page", async () => {
			const hint = await getActionableHint(".no-scroll", false);
			await rangoCommandWithTarget("scrollElementToCenter", [hint]);
			await waitForScroll("html");

			const center = await page.$eval(`a[data-hint='${hint}']`, getCenter);
			const cCenter = await page.evaluate(() => {
				return document.documentElement.clientHeight / 2;
			});

			expect(center).toBeCloseTo(cCenter, 0);
		});
	});

	describe("Bottom", () => {
		test("Scroll container", async () => {
			// We first need to scroll down the container a bit so the actionable hint
			// that we get can scroll to the bottom.
			await page.$eval(".scroll", (element) => {
				element.scrollBy(0, 200);
			});

			const hint = await getActionableHint(".scroll", false);

			await rangoCommandWithTarget("scrollElementToBottom", [hint]);
			await waitForScroll(".scroll");

			const bottom = await page.$eval(
				`a[data-hint='${hint}']`,
				(element) => element.getBoundingClientRect().bottom
			);
			const cBottom = await page.$eval(
				".scroll",
				(element) => element.getBoundingClientRect().bottom
			);

			expect(bottom).toBeCloseTo(cBottom);
		});

		test("Page", async () => {
			// We first need to scroll down the page a bit so the actionable hint
			// that we get can scroll to the bottom.
			await page.evaluate(() => {
				document.documentElement.scrollBy(0, 200);
			});

			const hint = await getActionableHint(".no-scroll", false);
			await rangoCommandWithTarget("scrollElementToBottom", [hint]);
			await waitForScroll("html");

			const bottom = await page.$eval(
				`a[data-hint='${hint}']`,
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
		await page.waitForSelector(".rango-hint");
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
