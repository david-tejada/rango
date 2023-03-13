import { retrieve } from "../../common/storage";
import { Options } from "../../typings/Storage";

let cachedOptions: Pick<Options, "hintFontSize" | "hintWeight" | "hintStyle">;

export async function cacheHintOptions() {
	const hintFontSize = await retrieve("hintFontSize");
	const hintWeight = await retrieve("hintWeight");
	const hintStyle = await retrieve("hintStyle");

	cachedOptions = { hintFontSize, hintWeight, hintStyle };
}

export function getHintOption<T extends keyof typeof cachedOptions>(
	key: T
): (typeof cachedOptions)[T] {
	return cachedOptions[key];
}
