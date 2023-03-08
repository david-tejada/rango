import {
	rangoCommandWithoutTarget,
	rangoCommandWithTarget,
} from "./utils/rangoCommands";

beforeEach(async () => {
	await page.goto("http://localhost:8080/dispatchEvents.html");
	await page.bringToFront();
});

test("Clicking an element triggers the appropriate events", async () => {
	await page.waitForSelector(".rango-hint");
	await rangoCommandWithTarget("clickElement", ["a"]);

	const events = await page.$$eval("[checked='true']", (elements) => {
		return elements.map((element) => element.id);
	});

	expect(events).toContain("pointerover");
	expect(events).toContain("pointerenter");
	expect(events).toContain("pointermove");
	expect(events).toContain("pointerdown");
	expect(events).toContain("pointerup");

	expect(events).toContain("mouseover");
	expect(events).toContain("mouseenter");
	expect(events).toContain("mousemove");
	expect(events).toContain("mousedown");
	expect(events).toContain("mouseup");

	expect(events).toContain("click");
	expect(events).toContain("focus");
	expect(events).toContain("focusin");
});

test("Hovering an element triggers the appropriate events", async () => {
	await page.waitForSelector(".rango-hint");
	await rangoCommandWithTarget("hoverElement", ["a"]);

	const events = await page.$$eval("[checked='true']", (elements) => {
		return elements.map((element) => element.id);
	});

	expect(events).toContain("pointerover");
	expect(events).toContain("pointerenter");
	expect(events).toContain("pointermove");

	expect(events).toContain("mouseover");
	expect(events).toContain("mouseenter");
	expect(events).toContain("mousemove");
});

test("Unhovering/dismissing triggers the appropriate events", async () => {
	await page.waitForSelector(".rango-hint");
	await rangoCommandWithoutTarget("unhoverAll");

	const events = await page.$$eval("[checked='true']", (elements) => {
		return elements.map((element) => element.id);
	});

	expect(events).toContain("pointermove");
	expect(events).toContain("pointerout");
	expect(events).toContain("pointerleave");

	expect(events).toContain("mousemove");
	expect(events).toContain("mouseout");
	expect(events).toContain("mouseleave");
});

test("Unhovering/dismissing blurs the active element", async () => {
	await page.waitForSelector(".rango-hint");
	await rangoCommandWithTarget("clickElement", ["a"]);
	await rangoCommandWithoutTarget("unhoverAll");

	const events = await page.$$eval("[checked='true']", (elements) => {
		return elements.map((element) => element.id);
	});

	expect(events).toContain("focusout");
});
