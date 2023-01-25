import puppeteer from "puppeteer";
import { launchBrowser } from "./utils/launchBrowser";
import { sleep } from "./utils/testHelpers";

let browser: puppeteer.Browser;
let page: puppeteer.Page;

beforeAll(async () => {
	({ browser, page } = await launchBrowser());
	await page.goto("http://127.0.0.1:8080/basic.html");
});

afterAll(async () => {
	await browser.close();
});

test("The URL is attached to the title", async () => {
	await sleep(500);

	const title = await page.evaluate(() => document.title);

	expect(title).toBe("Document - http://127.0.0.1:8080/basic.html");
});

test("If something in the page changes and the URL changes it updates the title", async () => {
	await page.evaluate(() => {
		document.body.innerHTML = "<h1>New page</h1>";
		window.history.pushState({}, "", "new.html");
	});

	await sleep(200);

	const title = await page.evaluate(() => document.title);

	expect(title).toBe("Document - http://127.0.0.1:8080/new.html");
});

test("If the hash changes the URL in the title is updated", async () => {
	await page.evaluate(() => {
		document.body.innerHTML =
			"<h1 id='first'>New page</h1><a href='#first'>First</a>";
		document.querySelector("a")?.click();
	});

	await sleep(200);

	const title = await page.evaluate(() => document.title);

	expect(title).toBe("Document - http://127.0.0.1:8080/new.html#first");
});
