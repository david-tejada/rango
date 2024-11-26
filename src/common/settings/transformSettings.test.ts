import { upgradeCustomSelectors } from "./transformSettings";

describe("upgradeCustomSelectors", () => {
	test("upgrades custom selectors from plain object format", () => {
		const value = {
			pattern1: { include: ["selector1", "selector2"], exclude: ["selector3"] },
			pattern2: { include: ["selector4"], exclude: ["selector5", "selector6"] },
		};

		const upgraded = upgradeCustomSelectors(value);

		expect(upgraded).toEqual([
			{ pattern: "pattern1", type: "include", selector: "selector1" },
			{ pattern: "pattern1", type: "include", selector: "selector2" },
			{ pattern: "pattern1", type: "exclude", selector: "selector3" },
			{ pattern: "pattern2", type: "include", selector: "selector4" },
			{ pattern: "pattern2", type: "exclude", selector: "selector5" },
			{ pattern: "pattern2", type: "exclude", selector: "selector6" },
		]);
	});

	test("upgrades custom selectors from Map format", () => {
		const value = new Map([
			[
				"pattern1",
				{ include: ["selector1", "selector2"], exclude: ["selector3"] },
			],
			[
				"pattern2",
				{ include: ["selector4"], exclude: ["selector5", "selector6"] },
			],
		]);

		const upgraded = upgradeCustomSelectors(value);

		expect(upgraded).toEqual([
			{ pattern: "pattern1", type: "include", selector: "selector1" },
			{ pattern: "pattern1", type: "include", selector: "selector2" },
			{ pattern: "pattern1", type: "exclude", selector: "selector3" },
			{ pattern: "pattern2", type: "include", selector: "selector4" },
			{ pattern: "pattern2", type: "exclude", selector: "selector5" },
			{ pattern: "pattern2", type: "exclude", selector: "selector6" },
		]);
	});

	test("returns original value if not upgradable", () => {
		const value = "invalid value";

		const upgraded = upgradeCustomSelectors(value);

		expect(upgraded).toBe(value);
	});
});
