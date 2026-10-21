import browser from "webextension-polyfill";
import { sendMessage } from "./sendMessage";

jest.mock("webextension-polyfill", () => ({
	__esModule: true,
	default: { tabs: { sendMessage: jest.fn() } },
}));

jest.mock("./pingContentScript", () => ({ pingContentScript: jest.fn() }));
jest.mock("../tabs/getCurrentTab", () => ({}));

const mockTabsSendMessage = jest.mocked(browser.tabs.sendMessage);

let consoleError: jest.SpyInstance;

beforeEach(() => {
	consoleError = jest.spyOn(console, "error").mockImplementation(() => {
		// Silence the output
	});
});

afterEach(() => {
	consoleError.mockRestore();
});

test("failing to reach a frame is thrown without logging", async () => {
	mockTabsSendMessage.mockRejectedValue(
		new Error("Could not establish connection. Receiving end does not exist.")
	);

	await expect(
		sendMessage("reclaimLabels", { amount: 1 }, { tabId: 1, frameId: 2 })
	).rejects.toThrow("Could not establish connection");
	expect(consoleError).not.toHaveBeenCalled();
});

test("other errors are logged with the message that failed", async () => {
	mockTabsSendMessage.mockRejectedValue(new Error("Something else"));

	await expect(
		sendMessage("reclaimLabels", { amount: 1 }, { tabId: 1, frameId: 2 })
	).rejects.toThrow("Something else");
	expect(consoleError).toHaveBeenCalledWith(
		"Content Script Error (reclaimLabels):",
		"Something else"
	);
});
