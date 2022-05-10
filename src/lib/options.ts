import browser from "webextension-polyfill";

export async function initOptions() {
	const options: Record<string, unknown> = {
		hintFontSize: 10,
		showHints: true,
	};

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

export async function getOption(option: string): Promise<unknown> {
	const localStorage = await browser.storage.local.get([option]);

	return localStorage[option] as unknown;
}

export async function setOption(option: Record<string, unknown>) {
	await browser.storage.local.set(option);
}
