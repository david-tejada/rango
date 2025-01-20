import { getBestFuzzyMatch, type FuzzyMatch } from "./getBestFuzzyMatch";

type TestMatch = FuzzyMatch & {
	frameId: number;
	text: string;
};

describe("getBestFuzzyMatch", () => {
	it("should return the best strong hintable match when available", () => {
		const matches: TestMatch[] = [
			{
				match: { score: 0.15, isHintable: true },
				frameId: 1,
				text: "submit",
			},
			{
				match: { score: 0.05, isHintable: false },
				frameId: 1,
				text: "description",
			},
			{
				match: { score: 0.25, isHintable: true },
				frameId: 1,
				text: "learn more",
			},
		];

		const result = getBestFuzzyMatch(matches);
		expect(result).toBe(matches[0]); // Score 0.15, hintable
	});

	it("should return excellent non-hintable match when no good hintable matches exist", () => {
		const matches: TestMatch[] = [
			{
				match: { score: 0.05, isHintable: false },
				frameId: 2,
				text: "product name",
			},
			{
				match: { score: 0.35, isHintable: true },
				frameId: 2,
				text: "contact",
			},
			{
				match: { score: 0.45, isHintable: true },
				frameId: 2,
				text: "close",
			},
		];

		const result = getBestFuzzyMatch(matches);
		expect(result).toBe(matches[0]); // Score 0.05, non-hintable
	});

	it("should return weak hintable match when no better matches exist", () => {
		const matches: TestMatch[] = [
			{
				match: { score: 0.35, isHintable: true },
				frameId: 1,
				text: "documentation",
			},
			{
				match: { score: 0.25, isHintable: false },
				frameId: 1,
				text: "welcome",
			},
			{
				match: { score: 0.45, isHintable: true },
				frameId: 1,
				text: "cancel",
			},
		];

		const result = getBestFuzzyMatch(matches);
		expect(result).toBe(matches[0]); // Score 0.35, hintable
	});

	it("should return best overall match when no matches meet threshold criteria", () => {
		const matches: TestMatch[] = [
			{
				match: { score: 0.45, isHintable: true },
				frameId: 3,
				text: "save changes",
			},
			{
				match: { score: 0.55, isHintable: false },
				frameId: 3,
				text: "status message",
			},
			{
				match: { score: 0.65, isHintable: true },
				frameId: 3,
				text: "settings",
			},
		];

		const result = getBestFuzzyMatch(matches);
		expect(result).toBe(matches[0]); // Score 0.45
	});

	it("should return undefined when matches array is empty", () => {
		const matches: TestMatch[] = [];
		expect(getBestFuzzyMatch(matches)).toBeUndefined();
	});
});
