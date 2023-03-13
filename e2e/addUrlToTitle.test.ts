import { sleep } from "./utils/testHelpers";

beforeAll(async () => {
	await page.goto("http://localhost:8080/basic.html");
});

test("The URL is attached to the title", async () => {
	await sleep(500);

	const title = await page.title();

	expect(title).toBe("Document - http://localhost:8080/basic.html");
});

test("If something in the page changes and the URL changes it updates the title", async () => {
	await page.evaluate(() => {
		document.body.innerHTML = "<h1>New page</h1>";
		window.history.pushState({}, "", "new.html");
	});

	await sleep(200);

	const title = await page.title();

	expect(title).toBe("Document - http://localhost:8080/new.html");
});

test("If the hash changes the URL in the title is updated", async () => {
	await page.evaluate(() => {
		document.body.innerHTML =
			"<h1 id='first'>New page</h1><a href='#first'>First</a>";
		document.querySelector("a")?.click();
	});

	await sleep(200);

	const title = await page.title();

	expect(title).toBe("Document - http://localhost:8080/new.html#first");
});
