/**
 * @jest-environment jsdom
 */

import { cacheLabels } from "../hints/labels/labelCache";

type ObserverCallback = (
	entries: Array<Partial<IntersectionObserverEntry>>
) => unknown;

const mockObservers: Array<{
	callback: ObserverCallback;
	options?: IntersectionObserverInit;
}> = [];

class MockObserver {
	constructor(callback: ObserverCallback, options?: IntersectionObserverInit) {
		mockObservers.push({ callback, options });
	}

	observe() {
		// Entries are delivered by the test
	}

	unobserve() {
		// Nothing to stop
	}

	disconnect() {
		// Nothing to stop
	}
}

globalThis.IntersectionObserver =
	MockObserver as unknown as typeof IntersectionObserver;
globalThis.ResizeObserver = MockObserver as unknown as typeof ResizeObserver;

/**
 * Labels the background has handed to this frame, as `cacheLabels` would
 * leave them for `Hint.claim` to pop.
 */
const mockLabelCache: string[] = [];

jest.mock("../hints/Hint", () => ({
	// eslint-disable-next-line @typescript-eslint/naming-convention
	Hint: class {
		label?: string;
		claim() {
			this.label = mockLabelCache.pop();
		}

		release() {
			this.label = undefined;
		}
	},
}));

jest.mock("../hints/labels/labelCache", () => ({ cacheLabels: jest.fn() }));
jest.mock("../hints/layoutCache", () => ({}));
jest.mock("../hints/selectors", () => ({}));
jest.mock("../hints/customHints/customHints", () => ({}));
jest.mock("../dom/isHintable", () => ({ isHintable: () => true }));
jest.mock("../dom/isVisible", () => ({ isVisible: () => true }));
jest.mock("../dom/isDisabled", () => ({ isDisabled: () => false }));
jest.mock("../dom/getUserScrollableContainer", () => ({
	getUserScrollableContainer: () => document.documentElement,
}));
jest.mock("../settings/settingsSync", () => ({
	settingsSync: { get: () => 0 },
}));
jest.mock("../messaging/messageHandler", () => ({
	sendMessage: jest.fn(),
	isContextInvalidated: () => false,
}));
jest.mock("./refresh", () => ({}));
jest.mock("./BoundedIntersectionObserver", () => ({
	// eslint-disable-next-line @typescript-eslint/naming-convention
	BoundedIntersectionObserver: globalThis.IntersectionObserver,
}));

const mockCacheLabels = jest.mocked(cacheLabels);

function getObserver(
	predicate: (options?: IntersectionObserverInit) => boolean
) {
	const observer = mockObservers.find(({ options }) => predicate(options));
	if (!observer) throw new Error("Observer not created");
	return observer;
}

/**
 * Adds a button that is in the viewport, before its intersection is reported.
 */
async function addButton() {
	// Imported here so that the observers it creates on load are the mocks.
	const { getOrCreateWrapper } = await import("./ElementWrapper");

	const button = document.createElement("button");
	document.body.append(button);
	const wrapper = getOrCreateWrapper(button);

	const viewportObserver = getObserver(
		(options) => options?.root === null && options.rootMargin === "0px"
	);
	await viewportObserver.callback([{ target: button, isIntersecting: true }]);

	return { button, wrapper };
}

/**
 * Adds a button that scrolls into view while claiming labels fails, so it ends
 * up intersecting but without a label.
 */
async function addButtonWithFailedClaim() {
	const { button, wrapper } = await addButton();

	mockCacheLabels.mockRejectedValueOnce(
		new Error("Could not establish connection. Receiving end does not exist.")
	);

	// Whether the failure escapes the callback doesn't matter here, only what
	// happens to the element afterwards.
	await Promise.resolve(
		intersectionObserver().callback([{ target: button, isIntersecting: true }])
	).catch(() => undefined);

	return { button, wrapper };
}

/**
 * Makes `cacheLabels` hand out as many labels as it's asked for.
 */
function cacheLabelsSucceeds() {
	let next = 0;
	mockCacheLabels.mockImplementation(async (necessary, additional) => {
		for (let i = 0; i < necessary + additional; i++) {
			mockLabelCache.push(`label${next++}`);
		}
	});
}

/**
 * The observer that reports elements entering and leaving the area around the
 * viewport, created once the first element is in view.
 */
function intersectionObserver() {
	return mockObservers.at(-1)!;
}

beforeEach(() => {
	jest.useFakeTimers();
	jest.spyOn(console, "error").mockImplementation(() => undefined);
	mockCacheLabels.mockReset();
});

test("elements left without a label after a failed claim are hinted later", async () => {
	const { wrapper } = await addButtonWithFailedClaim();
	mockCacheLabels.mockImplementation(async () => {
		mockLabelCache.push("a");
	});

	expect(wrapper.hint?.label).toBeUndefined();

	await jest.advanceTimersByTimeAsync(1000);

	expect(wrapper.hint?.label).toBe("a");
});

test("an element that scrolls away while the retry claims labels isn't hinted", async () => {
	const { button, wrapper } = await addButtonWithFailedClaim();

	let finishClaim!: () => void;
	mockCacheLabels.mockImplementation(
		async () =>
			new Promise<void>((resolve) => {
				finishClaim = () => {
					mockLabelCache.push("b");
					resolve();
				};
			})
	);

	await jest.advanceTimersByTimeAsync(1000);
	await intersectionObserver().callback([
		{ target: button, isIntersecting: false },
	]);
	finishClaim();
	await jest.advanceTimersByTimeAsync(0);

	expect(wrapper.isIntersecting).toBe(false);
	expect(wrapper.hint?.label).toBeUndefined();
});

test("an element whose label was reclaimed isn't hinted by a retry", async () => {
	cacheLabelsSucceeds();
	const reclaimed = await addButton();
	await intersectionObserver().callback([
		{ target: reclaimed.button, isIntersecting: true },
	]);
	expect(reclaimed.wrapper.hint?.label).toBeDefined();

	// What `reclaimLabels` does when another frame takes this label
	reclaimed.wrapper.unobserveIntersection();
	reclaimed.wrapper.hint?.release(false);

	const failed = await addButtonWithFailedClaim();
	await jest.advanceTimersByTimeAsync(1000);

	expect(failed.wrapper.hint?.label).toBeDefined();
	expect(reclaimed.wrapper.hint?.label).toBeUndefined();
});
