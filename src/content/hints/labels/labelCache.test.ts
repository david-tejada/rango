import { cacheLabels, popLabel } from "./labelCache";
import { claimLabels, reclaimLabelsFromOtherFrames } from "./labelRequest";

jest.mock("./labelRequest", () => ({
	claimLabels: jest.fn(),
	initStack: jest.fn(),
	reclaimLabelsFromOtherFrames: jest.fn(),
	releaseLabels: jest.fn(),
}));

jest.mock("../../wrappers/wrappers", () => ({ reclaimLabels: () => [] }));
jest.mock("../../setup/contentScriptContext", () => ({
	isMainFrame: () => true,
}));

const mockClaimLabels = jest.mocked(claimLabels);
const mockReclaimLabelsFromOtherFrames = jest.mocked(
	reclaimLabelsFromOtherFrames
);

test("failing to reclaim labels from other frames keeps the ones claimed", async () => {
	jest.spyOn(console, "error").mockImplementation(() => undefined);
	mockClaimLabels.mockResolvedValue(["a"]);
	mockReclaimLabelsFromOtherFrames.mockRejectedValue(
		new Error("Could not establish connection. Receiving end does not exist.")
	);

	await cacheLabels(3, 0);

	expect(popLabel()).toBe("a");
});
