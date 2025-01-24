import browser from "webextension-polyfill";
import { letterLabels, numberLabels } from "../../../common/labels";
import { retrieve } from "../../../common/storage/storage";
import { store } from "../../../common/storage/store";
import { type LabelStack } from "../../../typings/LabelStack";

export async function initStack(tabId: number) {
	const stack = await createStack(tabId);
	await store.set(`labelStack:${tabId}`, stack);
	return stack;
}

export async function getStack(tabId: number) {
	const stack = await store.get(`labelStack:${tabId}`);
	return stack ?? initStack(tabId);
}

export async function createStack(tabId: number): Promise<LabelStack> {
	const includeSingleLetterHints = await retrieve("includeSingleLetterHints");
	const keyboardClicking = await retrieve("keyboardClicking");
	const useNumberHints = await retrieve("useNumberHints");

	// To make all hints reachable via keyboard clicking, we exclude single-letter
	// hints when keyboard clicking is active.
	const possibleLabels =
		useNumberHints && !keyboardClicking
			? [...numberLabels]
			: includeSingleLetterHints && !keyboardClicking
				? [...letterLabels]
				: letterLabels.slice(0, -26);

	// We filter out any label the user has excluded or any label that starts with
	// an excluded key for the current url.
	const tab = await browser.tabs.get(tabId);
	const keysToExclude = await getKeysToExclude(tab.url!);
	const labelsToExclude = await retrieve("hintsToExclude");

	const filteredLabels = possibleLabels.filter(
		(label) =>
			!keysToExclude.has(label[0]!) &&
			!labelsToExclude
				.toLowerCase()
				.split(/[, ]/)
				.filter(Boolean)
				.map((string) => string.trim())
				.includes(label)
	);

	return {
		free: filteredLabels,
		assigned: new Map(),
	};
}

export async function removeStack(tabId: number) {
	await store.remove(`labelStack:${tabId}`);
}

/**
 * Get a set of keys to exclude for a given url according to the user settings.
 */
async function getKeysToExclude(url: string) {
	const keyboardClicking = await retrieve("keyboardClicking");
	if (!keyboardClicking) return new Set<string>();

	const keysToExclude = await retrieve("keysToExclude");

	// Get all matching patterns and map to their keys, then join with commas
	const allKeysToExclude = keysToExclude
		.filter(([pattern]) => new RegExp(pattern).test(url))
		.map(([_, keys]) => keys)
		.join(", ")
		.toLowerCase();

	return new Set(
		allKeysToExclude
			.split(/[, ]/)
			.map((string) => string.trim())
			.filter(Boolean)
	);
}

browser.tabs.onRemoved.addListener(async (tabId) => {
	try {
		await removeStack(tabId);
	} catch (error) {
		console.error(error);
	}
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
	try {
		if (changeInfo.discarded) await removeStack(tabId);
	} catch (error) {
		console.error(error);
	}
});
