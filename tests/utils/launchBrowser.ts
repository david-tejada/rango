// Using this because I can't find a way to make import.meta.url work in Jest
/* eslint-disable unicorn/prefer-module */
import path from "node:path";
import puppeteer from "puppeteer";

const EXTENSION_PATH = path.resolve(__dirname, "..", "..", "dist-mv3");

jest.setTimeout(30_000);

export async function launchBrowser(): Promise<{
	browser: puppeteer.Browser;
	page: puppeteer.Page;
}> {
	const browser = await puppeteer.launch({
		headless: false,
		devtools: true,
		args: [
			`--disable-extensions-except=${EXTENSION_PATH}`,
			`--load-extension=${EXTENSION_PATH}`,
		],
	});

	const pages = await browser.pages();
	const page = pages[0] ?? (await browser.newPage());
	await page.bringToFront();

	return { browser, page };
}
