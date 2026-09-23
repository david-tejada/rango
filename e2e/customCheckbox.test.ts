describe("Custom checkboxes", () => {
	beforeAll(async () => {
		await page.goto("http://localhost:8080/basic.html");
	});

	test("The label gets the hint when its checkbox has display: none", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
				<div>
					<input type="checkbox" id="hidden" style="display: none">
					<label for="hidden">English</label>
				</div>
			`;
		});

		await page.waitForSelector("[data-hint]:not(.rango-hint)");
		const hintedIds = await page.$$eval(
			"[data-hint]:not(.rango-hint)",
			(elements) => elements.map((element) => element.id || element.tagName)
		);

		expect(hintedIds).toEqual(["LABEL"]);
	});

	test("The checkbox keeps the hint when it has opacity: 0", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
				<div>
					<input type="checkbox" id="transparent" style="opacity: 0">
					<label for="transparent">English</label>
				</div>
			`;
		});

		await page.waitForSelector("[data-hint]:not(.rango-hint)");
		const hintedIds = await page.$$eval(
			"[data-hint]:not(.rango-hint)",
			(elements) => elements.map((element) => element.id || element.tagName)
		);

		expect(hintedIds).toEqual(["transparent"]);
	});
});
