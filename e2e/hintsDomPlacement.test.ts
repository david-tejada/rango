import puppeteer from "puppeteer";
import { getFileUrlPath } from "./utils/getFileUrlPath";
import { launchBrowser } from "./utils/launchBrowser";

describe("The hints are placed in the appropriate DOM element", () => {
	let browser: puppeteer.Browser;
	let page: puppeteer.Page;

	beforeAll(async () => {
		({ browser, page } = await launchBrowser());
		await page.goto(getFileUrlPath("./test-pages/basic.html"));
	});

	afterAll(async () => {
		await browser.close();
	});

	test("The hint will be placed in the positioned element closest to (and within) the user scrollable container that it's not positioned", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
				<div style="height: 10px; overflow: scroll">
					<div id="target" style="position: relative">
						<div>
								<a href="#">Link</a>
						</div>
					</div>
				</div>
			`;
		});

		await page.waitForSelector(".rango-hint");
		const $hint = await page.$("#target > .rango-hint");

		expect($hint).not.toBeNull();
	});

	test("The hint will be placed directly in the user scrollable container if it's positioned", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
				<div id="target" style="height: 10px; overflow: scroll; position: relative">
					<div id="target" style="position: relative">
						<div>
								<a href="#">Link</a>
						</div>
					</div>
				</div>
			`;
		});

		await page.waitForSelector(".rango-hint");
		const $hint = await page.$("#target > .rango-hint");

		expect($hint).not.toBeNull();
	});

	test("The hint will be placed in the first ancestor with a transform property", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
					<div style="position: relative">
						<div id="target" style="transform: translateX(20px)">
							<a href="#">Link</a>
						</div>
					</div>
			`;
		});

		await page.waitForSelector(".rango-hint");
		const $hint = await page.$("#target > .rango-hint");

		expect($hint).not.toBeNull();
	});

	test("The hint will be placed in the first ancestor with a property of 'will-change: transform'", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
					<div style="transform: translateX(20px)">
						<div id="target" style="will-change: transform">
							<a href="#">Link</a>
						</div>
					</div>
			`;
		});

		await page.waitForSelector(".rango-hint");
		const $hint = await page.$("#target > .rango-hint");

		expect($hint).not.toBeNull();
	});

	test("The hint for the summary element won't be placed inside the details element", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
			<details style="transform: translateX(20px)">
				<summary>Details</summary>
				Something small enough to escape casual notice.
			</details>
		`;
		});

		await page.waitForSelector(".rango-hint");
		const $noHint = await page.$("details > .rango-hint");

		expect($noHint).toBeNull();
	});

	test("The hint won't be placed in an element with display: contents", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
			<div id="skip" style="display: contents; transform: translateX(20px)">
				<a href="#">Link</a>
			</div>
		`;
		});

		await page.waitForSelector(".rango-hint");
		const $noHint = await page.$(".skip > .rango-hint");

		expect($noHint).toBeNull();
	});

	test("The hint won't be placed beyond its scroll container", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
				<ul style="height: 10px; overflow: auto">
					<li style="font-size: 20px">
						<a href="#">Link</a>
					</li>
				</ul>
		`;
		});

		await page.waitForSelector(".rango-hint");
		const $hint = await page.$("ul > .rango-hint");

		expect($hint).not.toBeNull();
	});

	test("The hint won't be placed beyond a fixed or sticky container", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
				<aside style="position: fixed; overflow: hidden">
					<div>
						<a href="#">Link</a>
					</div>
				</aside>
			`;
		});

		await page.waitForSelector(".rango-hint");
		let $hint = await page.$("aside > .rango-hint");

		expect($hint).not.toBeNull();

		await page.evaluate(() => {
			document.body.innerHTML = `
				<aside style="position: sticky">
					<div>
						<a href="#">Link</a>
					</div>
				</aside>
			`;
		});

		await page.waitForSelector(".rango-hint");
		$hint = await page.$("aside > .rango-hint");

		expect($hint).not.toBeNull();
	});
});
