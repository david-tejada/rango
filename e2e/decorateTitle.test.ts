import { type TalonAction } from "../src/typings/TalonAction";
import { rangoCommandWithoutTarget } from "./utils/rangoCommands";
import { setSetting, storageClipboard } from "./utils/serviceWorker";
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
	await setSetting("urlInTitle", true);
});

/**
 * The title of `page` while another tab is the current tab.
 */
async function getTitleWhileInactive() {
	const newPage = await browser.newPage();
	await sleep(500);
	const title = await page.title();

	await newPage.close();
	await page.bringToFront();
	await sleep(500);

	return title;
}

test("The URL is attached to the title of the current tab, without its tab marker", async () => {
	await sleep(500);

	const title = await page.title();

	expect(title).toBe("Document - http://localhost:8080/basic.html");
});

test("The tab marker is attached to the title while the tab isn't the current tab", async () => {
	const titleWhileInactive = await getTitleWhileInactive();
	const titleWhenCurrentAgain = await page.title();

	expect(titleWhileInactive).toBe(
		`${tabMarker} | Document - http://localhost:8080/basic.html`
	);
	expect(titleWhenCurrentAgain).toBe(
		"Document - http://localhost:8080/basic.html"
	);
});

test("If something in the page changes and the URL changes it updates the title", async () => {
	await page.evaluate(() => {
		document.body.innerHTML = "<h1>New page</h1>";
		history.pushState({}, "", "new.html");
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

test("A tab marker the page moves into the middle of the title is removed when the tab becomes the current tab", async () => {
	await page.goto("http://localhost:8080/basic.html");
	const newPage = await browser.newPage();
	await sleep(500);

	await page.evaluate(() => {
		document.title = `(1) ${document.title}`;
	});
	await sleep(500);
	const titleWhileInactive = await page.title();

	await newPage.close();
	await page.bringToFront();
	await sleep(500);

	expect(titleWhileInactive).toBe(
		`(1) ${tabMarker} | Document - http://localhost:8080/basic.html`
	);
	expect(await page.title()).toBe(
		"(1) Document - http://localhost:8080/basic.html"
	);
});

test("Compact delimiter removes spaces around the | separator", async () => {
	await setSetting("useCompactTabMarkerDelimiter", true);
	await page.goto("http://localhost:8080/basic.html");
	await sleep(500);

	const title = await getTitleWhileInactive();

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
		"Inbox - http://localhost:8080/untitled.html"
	);
});

test("A title the page sets after its fallback title was cleared gets decorated", async () => {
	await page.goto("http://localhost:8080/untitled.html");
	const newPage = await browser.newPage();
	await sleep(500);
	expect(await page.title()).toContain(`${tabMarker} | `);

	await newPage.close();
	await page.bringToFront();
	await sleep(500);
	expect(await page.title()).toBe("");

	await page.evaluate(() => {
		document.title = "Inbox";
	});
	await sleep(500);

	expect(await page.title()).toBe(
		"Inbox - http://localhost:8080/untitled.html"
	);
});

test("Copying a markdown link on a page without a title doesn't leave the link text empty", async () => {
	await page.goto("http://localhost:8080/untitled.html");
	await sleep(500);

	await rangoCommandWithoutTarget("copyCurrentTabMarkdownUrl");
	const response = JSON.parse(await storageClipboard.readText()) as {
		actions: TalonAction[];
	};

	expect(response.actions).toContainEqual({
		name: "copyToClipboard",
		textToCopy:
			"[localhost:8080/untitled.html](http://localhost:8080/untitled.html)",
	});
});

test("Copying a markdown link uses the title the page sets from its previous title", async () => {
	await setSetting("urlInTitle", false);
	await page.goto("http://localhost:8080/basic.html");
	await sleep(500);

	await page.evaluate(() => {
		document.title = `(1) ${document.title}`;
	});
	await sleep(500);

	await rangoCommandWithoutTarget("copyCurrentTabMarkdownUrl");
	const response = JSON.parse(await storageClipboard.readText()) as {
		actions: TalonAction[];
	};

	expect(response.actions).toContainEqual({
		name: "copyToClipboard",
		textToCopy: "[(1) Document](http://localhost:8080/basic.html)",
	});
});
