import { type Frame } from "puppeteer";
import { rangoCommandWithoutTarget } from "./utils/rangoCommands";
import { sleep } from "./utils/testHelpers";

async function testKeyboardClickingHighlighting(frame?: Frame) {
	const pageOrFrame = frame ?? page;
	await pageOrFrame.waitForSelector(".rango-hint");

	const borderWidthBefore = await pageOrFrame.$eval(
		".rango-hint",
		(element) => {
			const inner = element.shadowRoot!.querySelector(".inner")!;
			return Number.parseInt(
				globalThis.getComputedStyle(inner).borderWidth,
				10
			);
		}
	);

	await page.keyboard.type("a");
	await sleep(100);

	const [borderWidthAfter, borderColorAfter] = await pageOrFrame.$eval(
		".rango-hint",
		(element) => {
			const inner = element.shadowRoot!.querySelector(".inner")!;
			const style = globalThis.getComputedStyle(inner);
			return [Number.parseInt(style.borderWidth, 10), style.borderColor];
		}
	);

	expect(borderWidthAfter).toBe(borderWidthBefore + 1);
	expect(borderColorAfter).toMatch(/^rgba\(.+0\.7\)$/);

	await page.keyboard.type("a");
	await sleep(100);

	const [borderWidthAfterCompletion, borderColorAfterCompletion] =
		await pageOrFrame.$eval(".rango-hint", (element) => {
			const inner = element.shadowRoot!.querySelector(".inner")!;
			const style = globalThis.getComputedStyle(inner);
			return [Number.parseInt(style.borderWidth, 10), style.borderColor];
		});

	expect(borderWidthAfterCompletion).toBe(borderWidthBefore);
	expect(borderColorAfterCompletion).toMatch(/^rgba\(.+0\.3\)$/);
}

describe("Keyboard clicking toggling", () => {
	beforeEach(async () => {
		await page.goto("http://localhost:8080/singleLink.html");
		await page.bringToFront();
		await page.waitForSelector(".rango-hint");
	});

	test("The hints become double after activating keyboard clicking", async () => {
		await rangoCommandWithoutTarget("toggleKeyboardClicking");
		await page.waitForSelector(".rango-hint[data-hint='aa']");

		const doubleHint = await page.$(".rango-hint[data-hint='aa']");

		expect(doubleHint).not.toBeNull();
	});

	test("The hints become single again after deactivating keyboard clicking", async () => {
		await rangoCommandWithoutTarget("toggleKeyboardClicking");
		await page.waitForSelector(".rango-hint[data-hint='a']");

		const singleHint = await page.$(".rango-hint[data-hint='a']");

		expect(singleHint).not.toBeNull();
	});
});

describe("With hints in main frame", () => {
	beforeAll(async () => {
		await rangoCommandWithoutTarget("toggleKeyboardClicking");
	});

	afterAll(async () => {
		await rangoCommandWithoutTarget("toggleKeyboardClicking");
	});

	beforeEach(async () => {
		await page.goto("http://localhost:8080/singleLink.html");
		await page.bringToFront();
		await page.waitForSelector(".rango-hint");
	});

	test("Typing the hint characters clicks the link", async () => {
		await page.keyboard.type("aa");
		await page.waitForNavigation();

		expect(page.url()).toBe("http://localhost:8080/singleLink.html#");
	});

	test("Typing one hint character marks the hint with a border 1px wider and opacity 0.7 and resets after typing the second character", async () => {
		await testKeyboardClickingHighlighting();
	});
});

describe("With hints in other frames", () => {
	beforeAll(async () => {
		await rangoCommandWithoutTarget("toggleKeyboardClicking");
	});

	afterAll(async () => {
		await rangoCommandWithoutTarget("toggleKeyboardClicking");
	});

	beforeEach(async () => {
		await page.goto("http://localhost:8080/singleLinkMainFrame.html");
		await page.bringToFront();
		await page.waitForSelector("iframe");
	});

	test("Typing one hint character marks the hint with a border 1px wider and opacity 0.7 and resets after typing the second character", async () => {
		const frame = await page.$("iframe");
		const contentFrame = await frame!.contentFrame();
		await testKeyboardClickingHighlighting(contentFrame);
	});

	test("Typing the hint characters clicks the link", async () => {
		const $frame = await page.$("iframe");
		const frame = await $frame!.contentFrame();
		await frame.waitForSelector(".rango-hint");

		await page.keyboard.type("aa");
		await frame.waitForNavigation();

		expect(frame.url()).toBe("http://localhost:8080/singleLink.html#");
	});
});
