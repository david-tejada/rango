describe("The hints are placed in the appropriate DOM element", () => {
	beforeAll(async () => {
		await page.goto("http://localhost:8080/basic.html");
	});

	test("The hint won't be placed in an element with overflow hidden and insufficient space if another ancestor has sufficient space", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
				<div id="target">
					<div id="skip" style="overflow: hidden">
						<a href="#">Link</a>
					</div>
				</div>
			`;
		});

		await page.waitForSelector(".rango-hint");
		const $hint = await page.$("#target > .rango-hint");
		const $noHint = await page.$("#skip > .rango-hint");

		expect($hint).not.toBeNull();
		expect($noHint).toBeNull();
	});

	test("The hint will be placed in an element with overflow hidden but sufficient space", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
					<div style="overflow: hidden; padding: 20px">
						<a href="#">Link</a>
					</div>
			`;
		});

		await page.waitForSelector(".rango-hint");
		const $hint = await page.$("div > .rango-hint");

		expect($hint).not.toBeNull();
	});

	test("The hint for the summary element won't be placed inside the details element", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
			<details>
				<summary>Details</summary>
				Something small enough to escape casual notice.
			</details>
		`;
		});

		await page.waitForSelector(".rango-hint");
		const $hint = await page.$("body > .rango-hint");
		const $noHint = await page.$("details > .rango-hint");

		expect($hint).not.toBeNull();
		expect($noHint).toBeNull();
	});

	test("The hint won't be placed beyond its scroll container", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
				<ul style="height: 10px; overflow: auto">
					<li style="overflow: hidden; font-size: 20px">
						<a href="#">Link</a>
					</li>
				</ul>
		`;
		});

		await page.waitForSelector(".rango-hint");
		const $hint = await page.$("li > .rango-hint");

		expect($hint).not.toBeNull();
	});

	test("The hint won't be placed beyond a fixed or sticky container", async () => {
		await page.evaluate(() => {
			document.body.innerHTML = `
				<aside style="position: fixed; overflow: hidden">
					<div style="overflow: hidden">
						<a href="#">Link</a>
					</div>
				</aside>
			`;
		});

		await page.waitForSelector(".rango-hint");
		let $hint = await page.$("div > .rango-hint");

		expect($hint).not.toBeNull();

		await page.evaluate(() => {
			document.body.innerHTML = `
				<aside style="position: sticky; overflow: hidden">
					<div style="overflow: hidden">
						<a href="#">Link</a>
					</div>
				</aside>
			`;
		});

		await page.waitForSelector(".rango-hint");
		$hint = await page.$("div > .rango-hint");

		expect($hint).not.toBeNull();
	});
});
