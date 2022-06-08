import browser from "webextension-polyfill";

const defaultOptions: Record<string, unknown> = {
	hintFontSize: 10,
	showHints: true,
	hintWeight: "auto",
	hintStyle: "boxed",
};
const cachedOptions: Record<string, unknown> = {};

export async function initOptions() {
	const optionNames = Object.keys(defaultOptions);
	const savedOptions = await browser.storage.local.get(optionNames);
	const optionsToStore: Record<string, unknown> = {};

	for (const key of optionNames) {
		if (savedOptions[key] === undefined) {
			cachedOptions[key] = defaultOptions[key];
			optionsToStore[key] = defaultOptions[key];
		} else {
			cachedOptions[key] = savedOptions[key];
		}
	}

	// We only store options if they weren't already initiated to avoid triggering storage.onChanged
	// since that will trigger every time there's a value stored even if newValue === oldValue
	await browser.storage.local.set(optionsToStore);
}

export function getOption(option: string): unknown {
	return cachedOptions[option];
}

// Although we don't use this now it might come in handy when we need to store
// site specific options
export async function setOption(option: Record<string, unknown>) {
	const optionNames = Object.keys(option);
	for (const key of optionNames) {
		cachedOptions[key] = option[key];
	}

	await browser.storage.local.set(option);
}
