import puppeteer from "puppeteer";
import { getFileUrlPath } from "./utils/getFileUrlPath";
import { launchBrowser } from "./utils/launchBrowser";

let browser: puppeteer.Browser;
let page: puppeteer.Page;

beforeAll(async () => {
	({ browser, page } = await launchBrowser());
	await page.goto(getFileUrlPath("./test-pages/overflowHintVisibility.html"));
	await page.waitForSelector(".rango-hint");
});

afterAll(async () => {
	await browser.close();
});

// There is no easy way to check if the hint is visible but I know that in this
// case the position for the outer element must be relative, because a position
// of absolute would make the hint visible even if it's overflowing
test("Hint outer div position should be relative for elements within non positioned user scrollable containers", async () => {
	const position = await page.$eval(
		"ul:not(.relative) > .rango-hint",
		(shadowHost) => {
			const outer = shadowHost.shadowRoot?.querySelector(".outer");
			if (outer) return window.getComputedStyle(outer).position;
			return undefined;
		}
	);

	expect(position).toBe("relative");
});

test("Hint outer div position should be absolute for elements within positioned user scrollable containers", async () => {
	const position = await page.$eval(
		"ul.relative > .rango-hint",
		(shadowHost) => {
			const outer = shadowHost.shadowRoot?.querySelector(".outer");
			if (outer) return window.getComputedStyle(outer).position;
			return undefined;
		}
	);

	expect(position).toBe("absolute");
});
