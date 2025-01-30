export function toSerializable(value: unknown): unknown {
	if (value instanceof Map) {
		return {
			dataType: "Map",
			value: Array.from(value.entries()).map(([k, v]) => [
				k,
				toSerializable(v),
			]) as Array<[unknown, unknown]>,
		};
	}

	if (typeof value === "object" && value !== null && !Array.isArray(value)) {
		return Object.fromEntries(
			Object.entries(value).map(([key, value]) => [key, toSerializable(value)])
		);
	}

	return value;
}

export function fromSerializable(value: unknown): unknown {
	if (
		typeof value === "object" &&
		value !== null &&
		"dataType" in value &&
		value.dataType === "Map" &&
		"value" in value &&
		Array.isArray(value.value)
	) {
		return new Map(value.value.map(([k, v]) => [k, fromSerializable(v)]));
	}

	if (typeof value === "object" && value !== null && !Array.isArray(value)) {
		return Object.fromEntries(
			Object.entries(value).map(([key, value]) => [
				key,
				fromSerializable(value),
			])
		);
	}

	return value;
}
