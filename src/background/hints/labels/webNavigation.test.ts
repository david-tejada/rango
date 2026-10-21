import browser from "webextension-polyfill";
import { sendMessage } from "../../messaging/sendMessage";
import { addWebNavigationListeners } from "./webNavigation";

type NavigationDetails = { tabId: number; frameId: number; url: string };
type NavigationListener = (details: NavigationDetails) => Promise<void>;

jest.mock("webextension-polyfill", () => {
	const event = () => ({
		addListener: jest.fn(),
		removeListener: jest.fn(),
		hasListener: () => false,
	});

	return {
		__esModule: true,
		default: {
			tabs: { get: async () => ({ id: 1 }) },
			webNavigation: {
				onCommitted: event(),
				// eslint-disable-next-line @typescript-eslint/naming-convention
				onDOMContentLoaded: event(),
				onCompleted: event(),
			},
		},
	};
});

jest.mock("../../messaging/sendMessage", () => ({ sendMessage: jest.fn() }));
jest.mock("../../tabs/getCurrentTab", () => ({}));
jest.mock("../../utils/getAllFrames", () => ({}));
jest.mock("./labelStack", () => ({ initStack: jest.fn() }));

const mockSendMessage = jest.mocked(sendMessage);

async function navigateFrame(details: NavigationDetails) {
	await dispatch(browser.webNavigation.onCommitted, details);
	await dispatch(browser.webNavigation.onCompleted, details);
}

async function dispatch(
	event: { addListener: unknown },
	details: NavigationDetails
) {
	const { calls } = jest.mocked(event.addListener as jest.Mock).mock;

	for (const [listener] of calls as Array<[NavigationListener]>) {
		// eslint-disable-next-line no-await-in-loop
		await listener(details);
	}
}

addWebNavigationListeners();

test("a frame that is gone before its labels are synchronized is ignored", async () => {
	mockSendMessage.mockRejectedValue(
		new Error("Could not establish connection. Receiving end does not exist.")
	);

	await expect(
		navigateFrame({ tabId: 1, frameId: 3, url: "http://localhost/" })
	).resolves.toBeUndefined();
	expect(mockSendMessage).toHaveBeenCalledWith("synchronizeLabels", undefined, {
		tabId: 1,
		frameId: 3,
	});
});

test("other errors synchronizing labels still reach the caller", async () => {
	mockSendMessage.mockRejectedValue(new Error("Something else"));

	await expect(
		navigateFrame({ tabId: 1, frameId: 4, url: "http://localhost/" })
	).rejects.toThrow("Something else");
});
