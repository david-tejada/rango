import { Key, keyboard } from "@nut-tree/nut-js";
import { rangoCommandWithoutTarget } from "./utils/rangoCommands";

beforeEach(async () => {
	await page.goto("http://localhost:8080/singleLink.html");
	await page.bringToFront();
	await page.waitForSelector(".rango-hint");
});

test("The hints become double after activating keyboard clicking", async () => {
	await rangoCommandWithoutTarget("toggleKeyboardClicking");
	await page.waitForSelector(".rango-hint[data-hint='aa']");

	const doubleHint = await page.$(".rango-hint[data-hint='aa']");

	expect(doubleHint).not.toBeNull();
});

test("Typing the hint characters clicks the link", async () => {
	await keyboard.type(Key.A);
	await keyboard.type(Key.A);

	await page.waitForNavigation();

	expect(page.url()).toBe("http://localhost:8080/singleLink.html#");
});

test("The hints become single again after deactivating keyboard clicking", async () => {
	await rangoCommandWithoutTarget("toggleKeyboardClicking");
	await page.waitForSelector(".rango-hint[data-hint='a']");

	const singleHint = await page.$(".rango-hint[data-hint='a']");

	expect(singleHint).not.toBeNull();
});
