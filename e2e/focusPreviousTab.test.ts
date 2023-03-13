import { rangoCommandWithoutTarget } from "./utils/rangoCommands";
import { sleep } from "./utils/testHelpers";

beforeEach(async () => {
	await page.goto("http://localhost:8080/basic.html");
});

test("It switches between the last two focused tabs", async () => {
	const newPage = await browser.newPage();
	await newPage.goto("http://localhost:8080/basic.html");
	// I think this weight is necessary so the opened tab has had time to be
	// stored to storage
	await sleep(500);
	await rangoCommandWithoutTarget("focusPreviousTab");

	let pageVisibility = await page.evaluate(() => document.visibilityState);
	let newPageVisibility = await newPage.evaluate(
		() => document.visibilityState
	);

	expect(pageVisibility).toBe("visible");
	expect(newPageVisibility).toBe("hidden");

	await rangoCommandWithoutTarget("focusPreviousTab");

	pageVisibility = await page.evaluate(() => document.visibilityState);
	newPageVisibility = await newPage.evaluate(() => document.visibilityState);
	await newPage.close();

	expect(pageVisibility).toBe("hidden");
	expect(newPageVisibility).toBe("visible");
});
