import browser from "webextension-polyfill";

/**
 * The maximum number of bytes that can be stored in the sync storage for a
 * single item.
 *
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/sync
 */
const quotaBytesPerItem = 8192;

/**
 * Sets items in the sync storage. If the items are too large and exceed the
 * quota of bytes per item, they will be stored in chunks.
 */
async function set(items: Record<string, unknown>) {
	try {
		await browser.storage.sync.set(items);
		await removeChunks(Object.keys(items));
	} catch {
		return setWithChunkingFallback(items);
	}
}

/**
 * Gets an item from the sync storage.
 * If the item was stored in chunks, it will be retrieved from the chunks.
 */
async function get(key: string): Promise<Record<string, unknown>> {
	const value = await getStorageItem(key);
	if (value !== undefined) return { [key]: value };

	const firstChunk = await getStorageItem(`${key}_0`);
	if (firstChunk !== undefined) return { [key]: await getItemFromChunks(key) };

	return {};
}

async function setWithChunkingFallback(items: Record<string, unknown>) {
	await Promise.all(
		Object.entries(items).map(async ([key, value]) => {
			try {
				await browser.storage.sync.set({ [key]: value });
				await removeChunks(key);
			} catch {
				if (!isQuotaBytesPerItemExceeded(key, value)) {
					throw new Error(`Failed to store item "${key}"`);
				}

				await storeInChunks(key, value);
			}
		})
	);
}

async function getItemFromChunks(key: string) {
	const chunks = [];
	let index = 0;
	let chunk = await getStorageItem(`${key}_${index}`);

	while (chunk !== undefined) {
		chunks.push(chunk);
		index++;
		chunk = await getStorageItem(`${key}_${index}`); // eslint-disable-line no-await-in-loop
	}

	try {
		return JSON.parse(chunks.join("")) as unknown;
	} catch (error) {
		console.error(`Failed to parse chunks for key "${key}":`, error);
		return undefined;
	}
}

async function getStorageItem(key: string) {
	const record = await browser.storage.sync.get(key);
	return record[key];
}

function isQuotaBytesPerItemExceeded(key: string, value: unknown) {
	const bytesRequiredForItem = key.length + JSON.stringify(value).length;
	return bytesRequiredForItem > quotaBytesPerItem;
}

async function storeInChunks(key: string, value: unknown) {
	const storageObject: Record<string, string> = {};

	let remainingJsonString = JSON.stringify(value);
	let keyIndex = 0;

	while (remainingJsonString.length > 0) {
		const indexedKey = `${key}_${keyIndex}`;
		keyIndex++;

		const maxSize = quotaBytesPerItem - indexedKey.length;
		let chunkSize = maxSize;
		let chunk = remainingJsonString.slice(0, chunkSize);

		// Additional characters might have been used to, for example, escape
		// quotes. We reduce the size of the chunk until it no longer exceeds the
		// max size.
		while (JSON.stringify(chunk).length > maxSize) {
			chunkSize--;
			chunk = remainingJsonString.slice(0, chunkSize);
		}

		remainingJsonString = remainingJsonString.slice(chunkSize);

		storageObject[indexedKey] = chunk;
	}

	await browser.storage.sync.set(storageObject);
	// Remove excess chunks that might have been previously stored. This is
	// necessary in case the items get smaller and we need to store them in fewer
	// chunks.
	await removeChunks(key, keyIndex);
	await browser.storage.sync.remove(key);
}

/**
 * Removes chunks for the given keys.
 *
 * @param keys - The key or keys to remove chunks for.
 * @param startIndex - The index to start removing chunks from.
 *
 * @example
 * ```ts
 * await removeChunks("myKey", 2);
 * // Removes chunks for "myKey_2", "myKey_3", ..., "myKey_14"
 * ```
 */
async function removeChunks(keys: string | string[], startIndex = 0) {
	try {
		// The maximum number of chunks that can be stored is 13. Beyond that we would
		// exceed the maximum quota of 102400 bytes. We leave it at 15 to be safe.
		const maxChunks = 15;
		const length = maxChunks - startIndex;
		const keysArray = Array.isArray(keys) ? keys : [keys];
		const indexedKeys = keysArray.flatMap((key) =>
			Array.from({ length }, (_, i) => `${key}_${i + startIndex}`)
		);
		await browser.storage.sync.remove(indexedKeys);
	} catch (error) {
		console.error("Failed to remove chunks", error);
	}
}

export const syncStorage = {
	get,
	set,
	async remove(keys: string | string[]) {
		await browser.storage.sync.remove(keys);
		await removeChunks(keys);
	},
};
