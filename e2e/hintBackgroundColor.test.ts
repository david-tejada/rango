import { sleep } from "./utils/testHelpers";

describe("Background color", () => {
	beforeAll(async () => {
		await page.goto("http://localhost:8080/singleLink.html");
		await page.waitForSelector(".rango-hint");
	});

	test("If the element doesn't have a background color set the background color of the hint will be white", async () => {
		const backgroundColor = await page.$eval(".rango-hint", (hint) => {
			const inner = hint.shadowRoot?.querySelector(".inner");
			return getComputedStyle(inner!).backgroundColor;
		});

		expect(backgroundColor).toBe("rgb(255, 255, 255)");
	});

	test("If the element has an effective background color because of ancestors the hint will match that color", async () => {
		await page.goto("http://localhost:8080/effectiveBackgroundColor.html");
		await page.waitForSelector(".rango-hint");

		const backgroundColor = await page.$eval(".rango-hint", (hint) => {
			const inner = hint.shadowRoot?.querySelector(".inner");
			return getComputedStyle(inner!).backgroundColor;
		});

		expect(backgroundColor).toBe("rgb(0, 0, 128)");
	});

	test("If one of the ancestors changes color the hint will also change color", async () => {
		await page.evaluate(() => {
			const innerDiv: HTMLDivElement = document.querySelector("div > div")!;
			innerDiv.style.backgroundColor = "rgba(0, 0, 255, 0.25)";
		});

		// We need to wait here as there's a debounce for updating styles
		await sleep(100);

		const backgroundColor = await page.$eval(".rango-hint", (hint) => {
			const inner = hint.shadowRoot?.querySelector(".inner");
			return getComputedStyle(inner!).backgroundColor;
		});

		expect(backgroundColor).toBe("rgb(0, 0, 64)");
	});
});
