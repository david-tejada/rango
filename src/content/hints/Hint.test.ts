/**
 * @jest-environment jsdom
 */

import MockColor from "colorjs.io";
import { popLabel } from "./labels/labelCache";

jest.mock("./labels/labelCache", () => ({
	popLabel: jest.fn(),
	pushLabel: jest.fn(),
}));
jest.mock("../wrappers/wrappers", () => ({
	setHintedWrapper: jest.fn(),
	clearHintedWrapper: jest.fn(),
	getWrapperForElement: jest.fn(),
}));
// jsdom leaves system colors like `buttonface` unresolved, which the hint can't
// parse when it works out its own colors.
jest.mock("./color/hintColors", () => ({
	getHintBackgroundColor: () => new MockColor("white"),
	getHintForegroundColor: () => new MockColor("black"),
}));
jest.mock("../wrappers/refresh", () => ({}));
jest.mock("../settings/settingsSync", () => ({
	settingsSync: { get: () => undefined, onChange: jest.fn() },
}));
jest.mock("../settings/toggles", () => ({}));

const mockPopLabel = jest.mocked(popLabel);

globalThis.ResizeObserver = class {
	observe() {
		// Not needed here
	}

	unobserve() {
		// Not needed here
	}

	disconnect() {
		// Not needed here
	}
} as unknown as typeof ResizeObserver;

test("claiming a hint that already has a label keeps that label", async () => {
	mockPopLabel.mockReturnValueOnce("a").mockReturnValueOnce("b");
	// Imported here so that the observers it creates on load are the stubs.
	const hintModule = await import("./Hint");
	const hint = new hintModule.Hint(document.createElement("button"));

	hint.claim();
	hint.claim();

	expect(hint.label).toBe("a");
	expect(mockPopLabel).toHaveBeenCalledTimes(1);
});
