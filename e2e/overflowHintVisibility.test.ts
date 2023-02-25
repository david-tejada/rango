import { getFileUrlPath } from "./utils/getFileUrlPath";

beforeAll(async () => {
	await page.goto(getFileUrlPath("./test-pages/overflowHintVisibility.html"));
	await page.waitForSelector(".rango-hint");
});

// There is no easy way to check if the hint is visible but I know that in this
// case the position for the outer element must be relative, because a position
// of absolute would make the hint visible even if it's overflowing
test("Hint outer div position should be relative for elements overflowing if the scroll container doesn't contain the offset parent for outer", async () => {
	const position = await page.$eval(
		"li:nth-child(20) > .rango-hint",
		(shadowHost) => {
			const outer = shadowHost.shadowRoot?.querySelector(".outer");
			if (outer) return window.getComputedStyle(outer).position;
			return undefined;
		}
	);

	expect(position).toBe("relative");
});

test("Hint outer div position should be absolute for elements overflowing if the scroll container contains the offset parent for outer", async () => {
	await page.evaluate(() => {
		const scrollContainer = document.querySelector("ul")!;
		scrollContainer.style.position = "relative";
	});

	const position = await page.$eval(
		"ul.relative > li:nth-child(20) > .rango-hint",
		(shadowHost) => {
			const outer = shadowHost.shadowRoot?.querySelector(".outer");
			if (outer) return window.getComputedStyle(outer).position;
			return undefined;
		}
	);

	expect(position).toBe("absolute");
});
