export function hasMatchingKeys(
	object1: Record<string, unknown>,
	object2: Record<string, unknown>
): boolean {
	const keys1 = Object.keys(object1);
	const keys2 = Object.keys(object2);

	return keys1.some((key) => keys2.includes(key));
}

export async function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(true);
		}, ms);
	});
}
