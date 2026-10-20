import { type ElementMark, type Target } from "../../typings/Target/Target";
import { sendMessageToTargetFrames } from "../messaging/sendMessageToTargetFrames";
import { UnreachableContentScriptError } from "../messaging/UnreachableContentScriptError";
import { clickElement, directClickElement } from "./clickElement";

type CommittedDetails = { tabId: number; frameId: number; url: string };

const mockCommittedListeners = new Set<(details: CommittedDetails) => void>();

jest.mock("webextension-polyfill", () => ({
	__esModule: true,
	default: {
		tabs: { query: async () => [{ id: 1 }] },
		webNavigation: {
			onCommitted: {
				addListener(listener: (details: CommittedDetails) => void) {
					mockCommittedListeners.add(listener);
				},
				removeListener(listener: (details: CommittedDetails) => void) {
					mockCommittedListeners.delete(listener);
				},
			},
		},
	},
}));

jest.mock("../messaging/sendMessageToTargetFrames", () => ({
	sendMessageToTargetFrames: jest.fn(),
}));

jest.mock("../messaging/sendMessageToAllFrames", () => ({
	sendMessageToAllFrames: jest.fn(async () => ({ results: [] })),
}));

jest.mock("../../common/settings/settings", () => ({
	settings: { get: async () => true },
}));

const mockSendMessageToTargetFrames = jest.mocked(sendMessageToTargetFrames);

beforeEach(() => {
	mockCommittedListeners.clear();

	// Safari never settles the message to a page that has navigated away: no
	// reply and no error.
	mockSendMessageToTargetFrames.mockImplementation(
		async () =>
			new Promise(() => {
				// Never settles
			})
	);
});

const target: Target<ElementMark> = {
	type: "primitive",
	mark: { type: "elementHint", value: "a" },
};

async function commitNavigation(tabId: number, frameId: number) {
	// Let the command reach the point where it sends the click.
	await new Promise((resolve) => {
		setTimeout(resolve, 0);
	});

	for (const listener of mockCommittedListeners) {
		listener({ tabId, frameId, url: "http://localhost/other.html" });
	}
}

async function resolvesWithin(promise: Promise<unknown>, ms: number) {
	return Promise.race([
		promise.then(() => true),
		new Promise<boolean>((resolve) => {
			setTimeout(() => {
				resolve(false);
			}, ms);
		}),
	]);
}

describe("Clicking an element that navigates when the page never replies", () => {
	test("clickElement finishes once the tab navigates", async () => {
		const clicking = clickElement(target);
		await commitNavigation(1, 0);

		expect(await resolvesWithin(clicking, 100)).toBe(true);
		await expect(clicking).resolves.toBeUndefined();
	});

	test("directClickElement finishes once the tab navigates", async () => {
		const clicking = directClickElement(target);
		await commitNavigation(1, 0);

		expect(await resolvesWithin(clicking, 100)).toBe(true);
		await expect(clicking).resolves.toBeUndefined();
	});

	test("A navigation in another tab doesn't finish the click", async () => {
		const clicking = clickElement(target);
		await commitNavigation(2, 0);

		expect(await resolvesWithin(clicking, 100)).toBe(false);
	});

	test("A subframe navigating doesn't finish the click", async () => {
		const clicking = clickElement(target);
		await commitNavigation(1, 3);

		expect(await resolvesWithin(clicking, 100)).toBe(false);
	});
});

describe("Clicking an element that doesn't navigate", () => {
	test("The actions the page replies with are returned", async () => {
		mockSendMessageToTargetFrames.mockResolvedValue({
			results: [[{ name: "focusPage" }, { name: "sleep", ms: 50 }]],
			resultsWithFrameId: [],
		});

		await expect(clickElement(target)).resolves.toEqual([
			{ name: "focusPage" },
			{ name: "sleep", ms: 50 },
		]);
	});

	test("directClickElement types the characters when the tab has no content script", async () => {
		mockSendMessageToTargetFrames.mockRejectedValue(
			new UnreachableContentScriptError()
		);

		await expect(directClickElement(target)).resolves.toEqual({
			name: "typeTargetCharacters",
		});
	});
});
