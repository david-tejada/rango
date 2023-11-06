/* eslint-disable unicorn/no-array-reduce */
import { retrieve } from "./storage";

function stringToSet(keysString: string) {
	return new Set(
		keysString
			.split(/[, ]/)
			.map((string) => string.trim())
			.filter((string) => string)
	);
}

export async function getKeysToExclude(url: string) {
	const keyboardClicking = await retrieve("keyboardClicking");
	if (!keyboardClicking) return new Set<string>();

	const keysToExclude = await retrieve("keysToExclude");

	const allKeysToExclude = keysToExclude
		.filter(([pattern]) => new RegExp(pattern).test(url))
		.reduce((a, b) => `${a}, ${b[1]}`, "");

	return stringToSet(allKeysToExclude);
}
