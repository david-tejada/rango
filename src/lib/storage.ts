import browser from "webextension-polyfill";

export async function getStored(name: string): Promise<unknown> {
	const storage = await browser.storage.local.get(name);
	return storage[name] as unknown;
}

export async function saveToStorage(object: Record<string, any>) {
	await browser.storage.local.set(object);
}
