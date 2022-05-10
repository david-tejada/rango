import browser from "webextension-polyfill";

const options: Record<string, unknown> = {
	hintFontSize: 10,
	showHints: true,
};

export async function initOptions() {
	const savedOptions = await browser.storage.local.get(null);
	console.log(savedOptions);
	let key: keyof typeof options;
	for (key in options) {
		if (savedOptions[key]) {
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
}

function onStorageChange(changes: Record<string, unknown>) {
	let key: keyof typeof changes;
	for (key in changes) {
		if (Object.prototype.hasOwnProperty.call(changes, key)) {
			options[key] = changes[key];
		}
	}
}

browser.storage.onChanged.addListener(onStorageChange);
