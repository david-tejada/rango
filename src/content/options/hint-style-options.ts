import browser from "webextension-polyfill";

const cachedOptions: Record<string, unknown> = {};
const hintStyleOptionsKeys = ["hintFontSize", "hintWeight", "hintStyle"];

export async function cacheHintOptions() {
	const savedOptions = await browser.storage.local.get(hintStyleOptionsKeys);

	for (const key in savedOptions) {
		if (savedOptions[key] !== undefined) {
			cachedOptions[key] = savedOptions[key];
		}
	}
}

export function getHintOption(option: string): unknown {
	return cachedOptions[option];
}
