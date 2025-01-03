import { type TalonAction } from "../src/typings/TalonAction";
import {
	rangoCommandWithTarget,
	rangoCommandWithoutTarget,
} from "./utils/rangoCommands";
import { storageClipboard } from "./utils/serviceWorker";
import { sleep } from "./utils/testHelpers";

beforeEach(async () => {
	await page.goto("chrome://new-tab-page/");
});

describe("Direct clicking", () => {
	test("If no content script is loaded in the current page it sends the command to talon to type the characters", async () => {
		await rangoCommandWithTarget("directClickElement", ["a"]);
		await sleep(300);
		const clip = await storageClipboard.readText();
		const response = JSON.parse(clip) as {
			type: "response";
			actions: TalonAction[];
		};
		const found = response.actions.find(
			(action) => action.name === "typeTargetCharacters"
		);

		expect(found).toBeTruthy();
	});
});

describe("Background commands", () => {
	test("Commands that don't need the content script are still able to run", async () => {
		await rangoCommandWithoutTarget("copyLocationProperty", "href");
		const clip = await storageClipboard.readText();
		const response = JSON.parse(clip) as {
			type: "response";
			actions: TalonAction[];
		};
		const action = response.actions[0]!;

		expect(action).toBeDefined();

		const textToCopy = "textToCopy" in action ? action.textToCopy : undefined;

		expect(textToCopy).toBeDefined();
		expect(textToCopy).toBe("chrome://new-tab-page/");
	});
});
