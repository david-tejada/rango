import { rangoCommandWithoutTarget } from "./utils/rangoCommands";

beforeEach(async () => {
	await page.goto("http://localhost:8080/singleLink.html");
	await page.bringToFront();
	await rangoCommandWithoutTarget("resetToggleLevel", "everywhere");
});

describe("Global toggle", () => {
	test("Off", async () => {
		await page.waitForSelector(".rango-hint");
		await rangoCommandWithoutTarget("disableHints", "global");

		const $hint = await page.$(".rango-hint");

		expect($hint).toBeNull();
	});

	test("On", async () => {
		await rangoCommandWithoutTarget("enableHints", "global");
		await page.waitForSelector(".rango-hint");

		const $hint = await page.$(".rango-hint");

		expect($hint).not.toBeNull();
	});
});

describe("Tab toggle", () => {
	test("Off", async () => {
		await page.waitForSelector(".rango-hint");
		await rangoCommandWithoutTarget("disableHints", "tab");

		const $hint = await page.$(".rango-hint");

		expect($hint).toBeNull();
	});

	test("Off: different tab still shows hints", async () => {
		const newPage = await browser.newPage();
		await newPage.goto("http://localhost:8080/singleLink.html");

		await newPage.waitForSelector(".rango-hint");
		const $hintNewPage = await newPage.$(".rango-hint");
		await newPage.close();

		expect($hintNewPage).not.toBeNull();
	});

	test("On", async () => {
		await rangoCommandWithoutTarget("enableHints", "tab");
		await page.waitForSelector(".rango-hint");

		const $hint = await page.$(".rango-hint");

		expect($hint).not.toBeNull();
	});
});

describe("Host toggle", () => {
	test("Off", async () => {
		await page.waitForSelector(".rango-hint");
		await rangoCommandWithoutTarget("disableHints", "host");

		const $hint = await page.$(".rango-hint");

		expect($hint).toBeNull();
	});

	test("Off: different host still shows hints", async () => {
		const newPage = await browser.newPage();
		await newPage.goto("file:///");

		await newPage.waitForSelector(".rango-hint");
		const $hintNewPage = await newPage.$(".rango-hint");
		await newPage.close();

		expect($hintNewPage).not.toBeNull();
	});

	test("On", async () => {
		await rangoCommandWithoutTarget("enableHints", "host");
		await page.waitForSelector(".rango-hint");

		const $hint = await page.$(".rango-hint");

		expect($hint).not.toBeNull();
	});
});

describe("Page toggle", () => {
	test("Off", async () => {
		await page.waitForSelector(".rango-hint");
		await rangoCommandWithoutTarget("disableHints", "page");

		const $hint = await page.$(".rango-hint");

		expect($hint).toBeNull();
	});

	test("Off: different page still shows hints", async () => {
		const newPage = await browser.newPage();
		await newPage.goto("http://localhost:8080/tooltip.html");

		await newPage.waitForSelector(".rango-hint");
		const $hintNewPage = await newPage.$(".rango-hint");
		await newPage.close();

		expect($hintNewPage).not.toBeNull();
	});

	test("On", async () => {
		await rangoCommandWithoutTarget("enableHints", "page");
		await page.waitForSelector(".rango-hint");

		const $hint = await page.$(".rango-hint");

		expect($hint).not.toBeNull();
	});
});

describe("Now toggle", () => {
	test("Off", async () => {
		await page.waitForSelector(".rango-hint");
		await rangoCommandWithoutTarget("disableHints", "now");

		const $hint = await page.$(".rango-hint");

		expect($hint).toBeNull();
	});

	test("On", async () => {
		await rangoCommandWithoutTarget("enableHints", "now");
		await page.waitForSelector(".rango-hint");

		const $hint = await page.$(".rango-hint");

		expect($hint).not.toBeNull();
	});

	test("Off: after navigation hints show up again", async () => {
		await page.waitForSelector(".rango-hint");
		await rangoCommandWithoutTarget("disableHints", "now");
		const $hint = await page.$(".rango-hint");

		expect($hint).toBeNull();

		await page.goto("http://localhost:8080/singleLink.html");
		await page.waitForSelector(".rango-hint");
		const $hintAfterRefresh = await page.$(".rango-hint");

		expect($hintAfterRefresh).not.toBeNull();
	});
});

describe.only("Precedence", () => {
	test("Tab off", async () => {
		await page.waitForSelector(".rango-hint");
		await rangoCommandWithoutTarget("disableHints", "tab");

		const $hint = await page.$(".rango-hint");

		expect($hint).toBeNull();
	});

	test("Host on", async () => {
		await rangoCommandWithoutTarget("enableHints", "host");
		await page.waitForSelector(".rango-hint");

		const $hint = await page.$(".rango-hint");

		expect($hint).not.toBeNull();
	});

	test("Page off", async () => {
		await rangoCommandWithoutTarget("disableHints", "page");

		const $hint = await page.$(".rango-hint");

		expect($hint).toBeNull();
	});

	test("Now on", async () => {
		await rangoCommandWithoutTarget("enableHints", "now");
		await page.waitForSelector(".rango-hint");

		const $hint = await page.$(".rango-hint");

		expect($hint).not.toBeNull();
	});
});
