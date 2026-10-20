import { rangoCommandWithTarget } from "./utils/rangoCommands";
import { storageClipboard } from "./utils/serviceWorker";

async function getResponse() {
	return JSON.parse(await storageClipboard.readText()) as {
		type: string;
		actions: Array<{ name: string; message?: string }>;
	};
}

describe("Clicking an element that navigates to another page", () => {
	beforeEach(async () => {
		await page.goto("http://localhost:8080/navigatingButton.html");
		await page.bringToFront();
		await page.waitForSelector(".rango-hint");
	});

	test("The command doesn't fail when the page navigates away", async () => {
		await rangoCommandWithTarget("clickElement", ["a"]);

		const response = await getResponse();

		expect(response.actions).not.toContainEqual(
			expect.objectContaining({ name: "throwError" })
		);
		expect(page.url()).toBe("http://localhost:8080/singleLink.html");
	});
});
