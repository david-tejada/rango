async function getHintedIds(expectedIds: string[]) {
	await page.waitForSelector("[data-hint]:not(.rango-hint)");

	// If an expected hint never shows up we move on, so the assertion reports
	// which elements were hinted instead of timing out.
	await page
		.waitForFunction(
			(ids: string[]) =>
				ids.every((id) => document.querySelector(`#${id}[data-hint]`)),
			{ timeout: 3000 },
			expectedIds
		)
		.catch(() => undefined);

	return page.$$eval("[data-hint]:not(.rango-hint)", (elements) =>
		elements.map((element) => element.id || element.tagName)
	);
}

describe("Comboboxes", () => {
	beforeAll(async () => {
		await page.goto("http://localhost:8080/basic.html");
	});

	test("An input with role combobox gets one hint", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
				<input id="input-combobox" role="combobox" aria-label="Country" aria-expanded="false">
			`;
		});

		expect(await getHintedIds(["input-combobox"])).toEqual(["input-combobox"]);
	});

	test("A combobox wrapping an input gets one hint", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
				<div id="combobox" role="combobox" aria-haspopup="listbox" aria-expanded="false">
					<input id="inner-input" aria-label="Country">
				</div>
			`;
		});

		expect(await getHintedIds(["combobox"])).toEqual(["combobox"]);
	});

	test("A combobox wrapping a button gets one hint", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
				<div id="combobox" role="combobox" aria-haspopup="listbox" aria-expanded="false">
					<button id="inner-button">Country</button>
				</div>
			`;
		});

		expect(await getHintedIds(["combobox"])).toEqual(["combobox"]);
	});

	test("A MUI-style Select and its sibling button each get a hint", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
				<div style="position: relative">
					<div id="combobox" role="combobox" tabindex="0" aria-label="Status" aria-haspopup="listbox" aria-expanded="false">Open</div>
					<input aria-hidden="true" tabindex="-1" value="open" style="position: absolute; bottom: 0; left: 0; width: 100%; opacity: 0; pointer-events: none">
					<button id="sibling-button">Clear</button>
				</div>
			`;
		});

		expect(await getHintedIds(["combobox", "sibling-button"])).toEqual([
			"combobox",
			"sibling-button",
		]);
	});
});
