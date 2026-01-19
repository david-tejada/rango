import { setSetting } from "./utils/serviceWorker";
import { sleep } from "./utils/testHelpers";

// There is another tab open before the current one that also gets a marker.
// That's why we have to use this one.
const tabMarker = "B";

beforeAll(async () => {
	await page.goto("http://localhost:8080/basic.html");
});

afterAll(async () => {
	// Reset setting to default
	await setSetting("useCompactTabMarkerDelimiter", false);
});

test("The URL and the tab marker are attached to the title", async () => {
	await sleep(500);

	const title = await page.title();

	expect(title).toBe(
		`${tabMarker} | Document - http://localhost:8080/basic.html`
	);
});

test("If something in the page changes and the URL changes it updates the title", async () => {
	await page.evaluate(() => {
		document.body.innerHTML = "<h1>New page</h1>";
		history.pushState({}, "", "new.html");
	});

	await sleep(200);

	const title = await page.title();

	expect(title).toBe(
		`${tabMarker} | Document - http://localhost:8080/new.html`
	);
});

test("If the hash changes the URL in the title is updated", async () => {
	await page.evaluate(() => {
		document.body.innerHTML =
			"<h1 id='first'>New page</h1><a href='#first'>First</a>";
		document.querySelector("a")?.click();
	});

	await sleep(200);

	const title = await page.title();

	expect(title).toBe(
		`${tabMarker} | Document - http://localhost:8080/new.html#first`
	);
});

test("Compact delimiter removes spaces around the | separator", async () => {
	await setSetting("useCompactTabMarkerDelimiter", true);
	await page.goto("http://localhost:8080/basic.html");
	await sleep(500);

	const title = await page.title();

	expect(title).toBe(
		`${tabMarker}|Document - http://localhost:8080/basic.html`
	);
});
