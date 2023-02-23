import puppeteer from "puppeteer";
import { getFileUrlPath } from "./utils/getFileUrlPath";
import { launchBrowser } from "./utils/launchBrowser";

let browser: puppeteer.Browser;
let page: puppeteer.Page;

beforeAll(async () => {
	({ browser, page } = await launchBrowser());
	await page.goto(getFileUrlPath("./test-pages/basic.html"));
});

afterAll(async () => {
	await browser.close();
});
