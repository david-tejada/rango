import { type Frame } from "puppeteer";

const linksPerFrame = 40;

async function replaceFrame() {
	await page.evaluate(() => {
		const iframe = document.createElement("iframe");
		iframe.src = "manyLinks.html";
		iframe.style.height = "800px";
		document.querySelector("#frame-container")!.replaceChildren(iframe);
	});

	const frameHandle = await page.waitForSelector("#frame-container iframe");
	const frame = await frameHandle!.contentFrame();
	await frame.waitForSelector("ul");

	return frame;
}

/**
 * Waits for every link in the frame to be hinted and returns how many are, so
 * that a frame left without hints shows up in the assertion.
 */
async function waitForHintedLinks(frame: Frame) {
	await frame
		.waitForFunction(
			(count) => document.querySelectorAll("a[data-hint]").length === count,
			{ timeout: 3000 },
			linksPerFrame
		)
		.catch(() => undefined);

	return frame.$$eval("a[data-hint]", (links) => links.length);
}

beforeEach(async () => {
	await page.goto("http://localhost:8080/frameChurn.html");
	await page.waitForSelector("a[data-hint]");
});

test("Removing frames returns their labels, so new frames still get hints", async () => {
	// Each frame holds 40 labels and the stack has 702, so without returning the
	// labels of removed frames the stack is drained after about 17 frames.
	const hintedPerFrame: number[] = [];

	for (let i = 0; i < 25; i++) {
		// eslint-disable-next-line no-await-in-loop
		const frame = await replaceFrame();
		// eslint-disable-next-line no-await-in-loop
		hintedPerFrame.push(await waitForHintedLinks(frame));
	}

	// Every frame has to be fully hinted, not just the last one. A frame that
	// isn't hinted never claims labels, so it wouldn't drain the stack.
	expect(hintedPerFrame).toEqual(
		Array.from({ length: 25 }, () => linksPerFrame)
	);
}, 120_000);
