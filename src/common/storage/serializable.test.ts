import { fromSerializable, toSerializable } from "./serializable";

describe("toSerializable", () => {
	test("Should convert Map to serializable", () => {
		const value = new Map([
			["a", 1],
			["b", 2],
		]);
		const expectedValue = {
			dataType: "Map",
			value: Array.from(value.entries()),
		};

		const serializable = toSerializable(value);
		expect(serializable).toEqual(expectedValue);
	});

	test("Should convert object with map values to serializable", () => {
		const value = {
			free: ["a", "b"],
			assigned: new Map([
				["a", 1],
				["b", 2],
			]),
		};
		const expectedValue = {
			free: ["a", "b"],
			assigned: {
				dataType: "Map",
				value: [
					["a", 1],
					["b", 2],
				],
			},
		};

		const serializable = toSerializable(value);
		expect(serializable).toEqual(expectedValue);
	});

	test("Should convert nested Maps to serializable", () => {
		const innerMap1 = new Map([
			["x", "value1"],
			["y", "value2"],
		]);
		const innerMap2 = new Map([
			["a", "value3"],
			["b", "value4"],
		]);
		const outerMap = new Map([
			["map1", innerMap1],
			["map2", innerMap2],
		]);

		const expectedValue = {
			dataType: "Map",
			value: [
				[
					"map1",
					{
						dataType: "Map",
						value: [
							["x", "value1"],
							["y", "value2"],
						],
					},
				],
				[
					"map2",
					{
						dataType: "Map",
						value: [
							["a", "value3"],
							["b", "value4"],
						],
					},
				],
			],
		};

		const serializable = toSerializable(outerMap);
		expect(serializable).toEqual(expectedValue);
	});
	test("Should return the same value if it's already serializable", () => {
		expect(toSerializable(true)).toEqual(true);
		expect(toSerializable(7)).toEqual(7);
		expect(toSerializable("hello")).toEqual("hello");
		expect(toSerializable({ a: 1 })).toEqual({ a: 1 });
		expect(toSerializable([1, 2, 3])).toEqual([1, 2, 3]);
	});
});

describe("fromSerializable", () => {
	test("Should convert serializable to Map", () => {
		const value = {
			dataType: "Map",
			value: [
				["a", 1],
				["b", 2],
			],
		};
		const expectedValue = new Map([
			["a", 1],
			["b", 2],
		]);

		const deserialized = fromSerializable(value);
		expect(deserialized).toEqual(expectedValue);
	});

	test("Should convert object with serializable values to object", () => {
		const value = {
			free: ["a", "b"],
			assigned: {
				dataType: "Map",
				value: [
					["a", 1],
					["b", 2],
				],
			},
		};
		const expectedValue = {
			free: ["a", "b"],
			assigned: new Map([
				["a", 1],
				["b", 2],
			]),
		};

		const deserialized = fromSerializable(value);
		expect(deserialized).toEqual(expectedValue);
	});

	test("Should convert nested serializable Maps back to nested Maps", () => {
		const serializedValue = {
			dataType: "Map",
			value: [
				[
					"map1",
					{
						dataType: "Map",
						value: [
							["x", "value1"],
							["y", "value2"],
						],
					},
				],
				[
					"map2",
					{
						dataType: "Map",
						value: [
							["a", "value3"],
							["b", "value4"],
						],
					},
				],
			],
		};

		const expectedMap = new Map([
			[
				"map1",
				new Map([
					["x", "value1"],
					["y", "value2"],
				]),
			],
			[
				"map2",
				new Map([
					["a", "value3"],
					["b", "value4"],
				]),
			],
		]);

		const deserialized = fromSerializable(serializedValue);
		expect(deserialized).toEqual(expectedMap);
	});
	test("Should return the same value if no conversion is needed", () => {
		expect(fromSerializable(null)).toEqual(null);
		expect(fromSerializable(undefined)).toEqual(undefined);
		expect(fromSerializable(true)).toEqual(true);
		expect(fromSerializable(7)).toEqual(7);
		expect(fromSerializable("hello")).toEqual("hello");
		expect(fromSerializable({ a: 1 })).toEqual({ a: 1 });
		expect(fromSerializable([1, 2, 3])).toEqual([1, 2, 3]);
	});
});
