export function hasMatchingKeys(object1: object, object2: object): boolean {
	const keys1 = Array.isArray(object1)
		? Object.values(object1)
		: Object.keys(object1);
	const keys2 = Object.keys(object2);

	return keys1.some((key) => keys2.includes(key));
}
