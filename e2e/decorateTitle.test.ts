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

test("A page without a title shows the browser's fallback title between the decorations", async () => {
	await setSetting("useCompactTabMarkerDelimiter", false);
	await page.goto("http://localhost:8080/untitled.html");
	await sleep(500);

	// The current tab keeps the empty title so the browser shows its fallback.
	expect(await page.title()).toBe("");

	const newPage = await browser.newPage();
	await sleep(500);
	const titleWhileInactive = await page.title();

	await newPage.close();
	await page.bringToFront();
	await sleep(500);
	const titleWhenCurrentAgain = await page.title();

	expect(titleWhileInactive).toBe(
		`${tabMarker} | localhost:8080/untitled.html - http://localhost:8080/untitled.html`
	);
	expect(titleWhenCurrentAgain).toBe("");
});

test("The fallback title follows URL changes while the tab is inactive", async () => {
	await page.goto("http://localhost:8080/untitled.html");
	const newPage = await browser.newPage();
	await sleep(500);

	await page.evaluate(() => {
		history.pushState({}, "", "other.html");
	});
	await sleep(500);
	const title = await page.title();

	await newPage.close();
	await page.bringToFront();

	expect(title).toBe(
		`${tabMarker} | localhost:8080/other.html - http://localhost:8080/other.html`
	);
});

test("A title the page sets after being untitled gets decorated", async () => {
	await page.goto("http://localhost:8080/untitled.html");
	await sleep(500);

	await page.evaluate(() => {
		document.title = "Inbox";
	});
	await sleep(500);

	expect(await page.title()).toBe(
		`${tabMarker} | Inbox - http://localhost:8080/untitled.html`
	);
});
