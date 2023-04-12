import {
	rangoCommandWithoutTarget,
	rangoCommandWithTarget,
} from "./utils/rangoCommands";
import { sleep } from "./utils/testHelpers";

beforeEach(async () => {
	await page.goto("http://localhost:8080/tooltip.html");
	await page.bringToFront();
	await page.waitForSelector(".rango-hint");
});

test("It shows the tooltip when we issue the 'show' command", async () => {
	await rangoCommandWithTarget("showLink", ["a"]);
	await page.waitForSelector(".rango-tooltip");

	const tooltipContent = await page.$eval(
		".rango-tooltip",
		(tooltip) => tooltip.textContent
	);

	expect(tooltipContent).toBe("https://example.com/");
});

test("It removes the tooltip when the element scrolls", async () => {
	await rangoCommandWithTarget("showLink", ["a"]);
	await page.waitForSelector(".rango-tooltip");

	await rangoCommandWithoutTarget("scrollDownPage");
	await sleep(250);

	const tooltipContent = await page.$eval(
		".rango-tooltip",
		(tooltip) => tooltip.textContent
	);

	expect(tooltipContent).toBe("");
});
