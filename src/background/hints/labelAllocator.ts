import { Mutex } from "async-mutex";
import browser from "webextension-polyfill";
import { getKeysToExclude } from "../../common/getKeysToExclude";
import { letterLabels, numberLabels } from "../../common/labels";
import { retrieve, store } from "../../common/storage";
import { type LabelStack } from "../../typings/StorageSchema";
import { getAllFrames } from "../frames/frames";
import { getCurrentTabId } from "../utils/getCurrentTab";
import { navigationOccurred } from "./preloadTabs";

class LabelStackError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "LabelStackError";
	}
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
	const keysToExclude = tab.url
		? await getKeysToExclude(tab.url)
		: new Set<string>();
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

async function resetStack(stack: LabelStack, tabId: number) {
	const emptyStack = await getEmptyStack(tabId);
	stack.free = emptyStack.free;
	stack.assigned = emptyStack.assigned;
}

// These two functions should only be used by the withStack function
async function _getStack(tabId: number): Promise<LabelStack | undefined> {
	const stacks = await retrieve("labelStacks");
	return stacks.has(tabId) ? stacks.get(tabId) : undefined;
}

async function _saveStack(tabId: number, stack: LabelStack) {
	const stacks = await retrieve("labelStacks");
	stacks.set(tabId, stack);
	await store("labelStacks", stacks);
}

export async function getStack(tabId?: number) {
	const tabId_ = tabId ?? (await getCurrentTabId());
	const stack = await _getStack(tabId_);

	if (!stack) {
		throw new LabelStackError(`No label stack found for tab with id ${tabId}`);
	}

	return stack;
}

export async function getFrameIdForHint(hint: string, tabId?: number) {
	const stack = await getStack(tabId);
	const frameId = stack.assigned.get(hint);

	if (frameId === undefined) {
		throw new LabelStackError(`No hint found for tab with id ${tabId}`);
	}

	return frameId;
}

const mutex = new Mutex();

export async function withStack<T>(
	tabId: number,
	callback: (stack: LabelStack) => Promise<T>
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

export async function claimLabels(
	tabId: number,
	frameId: number,
	amount: number
): Promise<string[]> {
	return withStack(tabId, async (stack) => {
		if (await navigationOccurred(tabId)) {
			await resetStack(stack, tabId);
		}

		const labelsClaimed = stack.free.splice(-amount, amount);

		for (const label of labelsClaimed) {
			stack.assigned.set(label, frameId);
		}

		return labelsClaimed;
	});
}

export async function reclaimLabelsFromOtherFrames(
	tabId: number,
	frameId: number,
	amount: number
) {
	return withStack(tabId, async (stack) => {
		const frames = await getAllFrames(tabId);
		const otherFramesIds = frames
			.map((frame) => frame.frameId)
			.filter((id) => id !== frameId);

		const reclaimed: string[] = [];

		for (const frameId of otherFramesIds) {
			// I'm not using our sendMessage to avoid dependency cycle.
			// eslint-disable-next-line no-await-in-loop
			const reclaimedFromFrame: string[] = await browser.tabs.sendMessage(
				tabId,
				{ type: "reclaimLabels", amount: amount - reclaimed.length },
				{ frameId }
			);

			reclaimed.push(...reclaimedFromFrame);

			// Once we have enough labels we don't need to continue sending messages to
			// other frames
			if (reclaimed.length === amount) break;
		}

		if (reclaimed.length === 0) return [];

		for (const label of reclaimed) {
			stack.assigned.set(label, frameId);
		}

		return reclaimed;
	});
}

// We store labels in use when the content script has been reloaded when the user
// navigated back or forward in history
export async function storeLabelsInFrame(
	tabId: number,
	frameId: number,
	labels: string[]
) {
	await withStack(tabId, async (stack) => {
		stack.free = stack.free.filter((value) => !labels.includes(value));

		for (const label of labels) {
			stack.assigned.set(label, frameId);
		}
	});
}

export async function releaseLabels(tabId: number, labels: string[]) {
	await withStack(tabId, async (stack) => {
		// We make sure the labels to release are actually assigned
		const filteredLabels = labels.filter((label) => stack.assigned.has(label));
		stack.free.push(...filteredLabels);
		stack.free.sort((a, b) => b.length - a.length || b.localeCompare(a));

		for (const label of filteredLabels) {
			stack.assigned.delete(label);
		}
	});
}
