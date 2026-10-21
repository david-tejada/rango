import browser from "webextension-polyfill";
import { sendMessage } from "./messageHandler";

jest.mock("webextension-polyfill", () => ({
	__esModule: true,
	default: { runtime: { id: "rango", sendMessage: jest.fn() } },
}));

const mockRuntimeSendMessage = jest.mocked(browser.runtime.sendMessage);

let consoleError: jest.SpyInstance;

beforeEach(() => {
	mockRuntimeSendMessage.mockReset();
	browser.runtime.id = "rango";
	consoleError = jest.spyOn(console, "error").mockImplementation(() => {
		// Silence the output
	});
});

afterEach(() => {
	consoleError.mockRestore();
});

test("a message dropped while the background starts up is sent again", async () => {
	mockRuntimeSendMessage
		.mockRejectedValueOnce(
			new Error("Could not establish connection. Receiving end does not exist.")
		)
		.mockResolvedValueOnce(["a", "b"]);

	await expect(sendMessage("claimLabels", { amount: 2 })).resolves.toEqual([
		"a",
		"b",
	]);
});

test("other errors are not retried", async () => {
	mockRuntimeSendMessage.mockRejectedValue(new Error("Something else"));

	await expect(sendMessage("claimLabels", { amount: 2 })).rejects.toThrow(
		"Something else"
	);
	expect(mockRuntimeSendMessage).toHaveBeenCalledTimes(1);
});

test("an orphaned content script fails quietly", async () => {
	// What is left of `browser.runtime` once the extension is reloaded
	(browser.runtime as { id?: string }).id = undefined;
	mockRuntimeSendMessage.mockRejectedValue(
		new Error("Extension context invalidated.")
	);

	await expect(sendMessage("claimLabels", { amount: 2 })).rejects.toThrow(
		"Extension context invalidated."
	);
	expect(mockRuntimeSendMessage).toHaveBeenCalledTimes(1);
	expect(consoleError).not.toHaveBeenCalled();
});
