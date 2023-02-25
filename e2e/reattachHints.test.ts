/* eslint-disable no-await-in-loop */
import { getFileUrlPath } from "./utils/getFileUrlPath";
import { sleep } from "./utils/testHelpers";

beforeEach(async () => {
	await page.goto(getFileUrlPath("./test-pages/basic.html"));
});

test("The hint is reattached if it is deleted by the page", async () => {
	await page.evaluate(() => {
		document.body.innerHTML = `
			<a href="#">Link</a>
		`;
	});

	await page.waitForSelector(".rango-hint");

	await page.evaluate(() => {
		document.querySelector(".rango-hint")?.remove();
	});

	const hint = await page.waitForSelector(".rango-hint");

	expect(hint).not.toBeNull();
});

test("The hint is reattached a maximum of 10 times", async () => {
	await page.evaluate(() => {
		document.body.innerHTML = `
			<a href="#">Link</a>
		`;
	});

	await page.waitForSelector(".rango-hint");

	for (let i = 0; i < 10; i++) {
		await page.evaluate(() => {
			document.querySelector(".rango-hint")?.remove();
		});

		await page.waitForSelector(".rango-hint");
	}

	await page.evaluate(() => {
		document.querySelector(".rango-hint")?.remove();
	});

	await sleep(200);

	const hint = await page.$(".rango-hint");

	expect(hint).toBeNull();
});
