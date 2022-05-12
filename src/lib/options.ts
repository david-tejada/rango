import browser, { Storage } from "webextension-polyfill";

// Default options. Will be overridden by initOptions with the options in local storage
const options: Record<string, unknown> = {
	hintFontSize: 10,
	showHints: true,
};

export async function initOptions() {
	const savedOptions = await browser.storage.local.get(null);
	let key: keyof typeof options;
	for (key in options) {
		if (savedOptions[key] !== undefined) {
			options[key] = savedOptions[key];
		}
	}

	await browser.storage.local.set(options);
}

export function getOption(option: string): unknown {
	return options[option];
}

export async function setOption(option: Record<string, unknown>) {
	await browser.storage.local.set(option);

	// Even though onStorageChange does this I need to do it here too to avoid race conditions
	let key: keyof typeof option;
	for (key in option) {
		if (Object.prototype.hasOwnProperty.call(option, key)) {
			options[key] = option[key];
		}
	}
}

// It seems that I have to have this listener here to have local storage updated
function onStorageChange(changes: Record<string, unknown>) {
	let key: keyof typeof changes;
	for (key in changes) {
		if (Object.prototype.hasOwnProperty.call(changes, key)) {
			options[key] = (changes[key] as Storage.StorageChange).newValue;
		}
	}
}

browser.storage.onChanged.addListener(onStorageChange);
