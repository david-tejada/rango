import { Mutex } from "async-mutex";
import browser from "webextension-polyfill";
import { getKeysToExclude } from "../../common/getKeysToExclude";
import { retrieve, store } from "../../common/storage";
import { type HintsStack } from "../../typings/StorageSchema";
import { letterHints, numberHints } from "../../common/allHints";
import { navigationOccurred } from "./preloadTabs";

async function getEmptyStack(tabId: number): Promise<HintsStack> {
	const includeSingleLetterHints = await retrieve("includeSingleLetterHints");
	const keyboardClicking = await retrieve("keyboardClicking");
	const useNumberHints = await retrieve("useNumberHints");

	// To make all hints reachable via keyboard clicking, we exclude single-letter
	// hints when keyboard clicking is active.
	const possibleHints =
		useNumberHints && !keyboardClicking
			? [...numberHints]
			: includeSingleLetterHints && !keyboardClicking
				? [...letterHints]
				: letterHints.slice(0, -26);

	// We filter out any hint the user has excluded or any hint that starts with
	// an excluded key for the current url.
	const tab = await browser.tabs.get(tabId);
	const keysToExclude = tab.url
		? await getKeysToExclude(tab.url)
		: new Set<string>();
	const hintsToExclude = await retrieve("hintsToExclude");

	const filteredHints = possibleHints.filter(
		(hint) =>
			!keysToExclude.has(hint[0]!) &&
			!hintsToExclude
				.toLowerCase()
				.split(/[, ]/)
				.filter(Boolean)
				.map((string) => string.trim())
				.includes(hint)
	);

	return {
		free: filteredHints,
		assigned: new Map(),
	};
}

async function resetStack(stack: HintsStack, tabId: number) {
	const emptyStack = await getEmptyStack(tabId);
	stack.free = emptyStack.free;
	stack.assigned = emptyStack.assigned;
}

// These two functions should only be used by the withStack function
async function _getStack(tabId: number): Promise<HintsStack | undefined> {
	const stacks = await retrieve("hintsStacks");
	return stacks.has(tabId) ? stacks.get(tabId) : undefined;
}

async function _saveStack(tabId: number, stack: HintsStack) {
	const stacks = await retrieve("hintsStacks");
	stacks.set(tabId, stack);
	await store("hintsStacks", stacks);
}

const mutex = new Mutex();

export async function withStack<T>(
	tabId: number,
	callback: (stack: HintsStack) => Promise<T>
): Promise<T> {
	return mutex.runExclusive(async () => {
		const stack = (await _getStack(tabId)) ?? (await getEmptyStack(tabId));
		const result = await callback(stack);
		await _saveStack(tabId, stack);
		return result;
	});
}

export async function initStack(tabId: number) {
	await withStack(tabId, async (stack) => {
		await resetStack(stack, tabId);
	});
}

export async function claimHints(
	tabId: number,
	frameId: number,
	amount: number
): Promise<string[]> {
	return withStack(tabId, async (stack) => {
		if (await navigationOccurred(tabId)) {
			await resetStack(stack, tabId);
		}

		const hintsClaimed = stack.free.splice(-amount, amount);

		for (const hint of hintsClaimed) {
			stack.assigned.set(hint, frameId);
		}

		// This is necessary for keyboard clicking
		const hintsInTab = [...stack.assigned.keys()];
		await browser.tabs.sendMessage(tabId, {
			type: "updateHintsInTab",
			hints: hintsInTab,
		});

		return hintsClaimed;
	});
}

export async function reclaimHintsFromOtherFrames(
	tabId: number,
	frameId: number,
	amount: number
) {
	return withStack(tabId, async (stack) => {
		const frames = (await browser.webNavigation.getAllFrames({ tabId })) ?? [];
		const otherFramesIds = frames
			.map((frame) => frame.frameId)
			.filter((id) => id !== frameId);

		const reclaimed: string[] = [];

		for (const id of otherFramesIds) {
			// eslint-disable-next-line no-await-in-loop
			const reclaimedFromFrame: string[] = await browser.tabs.sendMessage(
				tabId,
				{
					type: "reclaimHints",
					amount: amount - reclaimed.length,
				},
				{ frameId: id }
			);

			reclaimed.push(...reclaimedFromFrame);

			// Once we have enough hints we don't need to continue sending messages to
			// other frames
			if (reclaimed.length === amount) break;
		}

		if (reclaimed.length === 0) return [];

		for (const hint of reclaimed) {
			stack.assigned.set(hint, frameId);
		}

		const hintsInTab = [...stack.assigned.keys()];
		await browser.tabs.sendMessage(tabId, {
			type: "updateHintsInTab",
			hints: hintsInTab,
		});

		return reclaimed;
	});
}

// We store hints in use when the content script has been reloaded when the user
// navigated back or forward in history
export async function storeHintsInFrame(
	tabId: number,
	frameId: number,
	hints: string[]
) {
	await withStack(tabId, async (stack) => {
		stack.free = stack.free.filter((value) => !hints.includes(value));

		for (const hint of hints) {
			stack.assigned.set(hint, frameId);
		}
	});
}

export async function releaseHints(tabId: number, hints: string[]) {
	await withStack(tabId, async (stack) => {
		// We make sure the hints to release are actually assigned
		const filteredHints = hints.filter((hint) => stack.assigned.has(hint));
		stack.free.push(...filteredHints);
		stack.free.sort((a, b) => b.length - a.length || b.localeCompare(a));

		for (const hint of filteredHints) {
			stack.assigned.delete(hint);
		}
	});
}
