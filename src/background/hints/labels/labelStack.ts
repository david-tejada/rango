import { Mutex } from "async-mutex";
import browser from "webextension-polyfill";
import { letterLabels, numberLabels } from "../../../common/labels";
import { retrieve, store } from "../../../common/storage/storage";
import { type LabelStack } from "../../../typings/StorageSchema";

const mutex = new Mutex();

/**
 * Execute a callback with the label stack for a tab. The execution is locked
 * with a mutex to prevent race conditions.
 *
 * Make sure of not reassigning the stack in the callback as it will not be
 * saved.
 */
export async function withStack<T>(
	tabId: number,
	callback: (stack: LabelStack) => Promise<T>
): Promise<T> {
	return mutex.runExclusive(async () => {
		const stack = await getStack(tabId);
		const result = await callback(stack);
		await saveStack(tabId, stack);
		return result;
	});
}

/**
 * Initialize the label stack for a tab.
 */
export async function initStack(tabId: number) {
	await withStack(tabId, async (stack) => {
		await resetStack(stack, tabId);
	});
}

/**
 * Retrieve the label stack for a tab.
 *
 * @throws If no stack is found for the tab.
 */
export async function getRequiredStack(tabId: number) {
	const stack = await getStack(tabId);

	if (!stack) {
		throw new Error(`No label stack found for tab with id ${tabId}`);
	}

	return stack;
}

/**
 * Reset the label stack for a tab. It resets the stack in place.
 */
export async function resetStack(stack: LabelStack, tabId: number) {
	const emptyStack = await getEmptyStack(tabId);
	stack.free = emptyStack.free;
	stack.assigned = emptyStack.assigned;
}

/**
 * Get the frame id for a hint.
 *
 * @throws If no hint is found for the tab.
 */
export async function getFrameIdForHint(hint: string, tabId: number) {
	const stack = await getRequiredStack(tabId);
	const frameId = stack.assigned.get(hint);

	if (frameId === undefined) {
		throw new Error(`No hint found for tab with id ${tabId}`);
	}

	return frameId;
}

async function getStack(tabId: number) {
	const stacks = await retrieve("labelStacks");
	return stacks.get(tabId) ?? getEmptyStack(tabId);
}

async function saveStack(tabId: number, stack: LabelStack) {
	const stacks = await retrieve("labelStacks");
	stacks.set(tabId, stack);
	await store("labelStacks", stacks);
}

async function getEmptyStack(tabId: number): Promise<LabelStack> {
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
