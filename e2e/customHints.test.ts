import { ElementHandle, Frame } from "puppeteer";
import { getHintForElement } from "./utils/getHintForElement";
import {
	rangoCommandWithTarget,
	rangoCommandWithoutTarget,
} from "./utils/rangoCommands";
import { sleep } from "./utils/testHelpers";

describe("Main frame", () => {
	beforeAll(async () => {
		await page.goto("http://localhost:8080/extraHintables.html");
		await rangoCommandWithoutTarget("displayExtraHints");
		await page.waitForSelector(".rango-hint");
	});

	test("Extra hints are displayed", async () => {
		const hintElement = await page.$(".rango-hint");

		expect(hintElement).not.toBeNull();
	});

	test("Extra hints are saved", async () => {
		const hintable = await page.$("#custom-button")!;
		const hint = await hintable!.evaluate(getHintForElement);

		await rangoCommandWithTarget("includeExtraSelectors", [hint]);
		await rangoCommandWithoutTarget("confirmSelectorsCustomization");

		await page.goto("http://localhost:8080/extraHintables.html");

		await page.waitForSelector(".rango-hint");
		const hintElement = await page.$(".rango-hint");

		expect(hintElement).not.toBeNull();
	});

	test("Extra hints are reset", async () => {
		await rangoCommandWithoutTarget("resetCustomSelectors");

		await page.goto("http://localhost:8080/extraHintables.html");
		await sleep(200);

		const hintElement = await page.$(".rango-hint");

		expect(hintElement).toBeNull();
	});
});

describe("iFrame", () => {
	let $iframe: ElementHandle<HTMLIFrameElement>;
	let frame: Frame;

	beforeAll(async () => {
		await page.goto("http://localhost:8080/extraHintables.html");
		await page.bringToFront();
		await page.waitForSelector("iframe");
		$iframe = (await page.$("iframe"))!;
		frame = (await $iframe!.contentFrame())!;
		await rangoCommandWithoutTarget("displayExtraHints");
	});

	test("Extra hints are displayed", async () => {
		await frame.waitForSelector(".rango-hint");

		const hintElement = await frame.$(".rango-hint");

		expect(hintElement).not.toBeNull();
	});

	test("Extra hints are saved", async () => {
		const hintable = await frame.$("#custom-button")!;
		const hint = await hintable!.evaluate(getHintForElement);

		await rangoCommandWithTarget("includeExtraSelectors", [hint]);
		await rangoCommandWithoutTarget("confirmSelectorsCustomization");

		await page.goto("http://localhost:8080/extraHintables.html");
		$iframe = (await page.$("iframe"))!;
		frame = (await $iframe!.contentFrame())!;

		await frame.waitForSelector(".rango-hint");
		const hintElement = await frame.$(".rango-hint");

		expect(hintElement).not.toBeNull();
	});

	test("Extra hints are reset", async () => {
		await rangoCommandWithoutTarget("resetCustomSelectors");

		await page.goto("http://localhost:8080/extraHintables.html");
		await sleep(200);

		$iframe = (await page.$("iframe"))!;
		frame = (await $iframe!.contentFrame())!;

		const hintElement = await frame.$(".rango-hint");

		expect(hintElement).toBeNull();
	});
});
