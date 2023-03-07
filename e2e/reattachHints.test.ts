beforeEach(async () => {
	await page.goto("http://localhost:8080/reattachHints.html");
});

test("The hint is moved up if it is deleted by the page", async () => {
	const hint = await page.waitForSelector("ul > .rango-hint");

	expect(hint).not.toBeNull();
});
