import browser from "webextension-polyfill";
import { Mutex } from "async-mutex";
import { HintsStack } from "../../typings/Storage";
import { retrieve, store } from "../../common/storage";
import { allHints } from "./allHints";

const mutex = new Mutex();

export async function getStack(tabId: number): Promise<HintsStack> {
	const stacks = await retrieve("hintsStacks");
	let stack = stacks.get(tabId);

	if (!stack) {
		stack = {
			free: [...allHints],
			assigned: new Map(),
		};
		await saveStack(stack, tabId);
	}

	return stack;
}

async function saveStack(stack: HintsStack, tabId: number) {
	const stacks = await retrieve("hintsStacks");
	stacks.set(tabId, stack);
	await store("hintsStacks", stacks);
}

export async function initStack(tabId: number, frameId: number) {
	if (frameId === 0) {
		const includeSingleLetterHints = await retrieve("includeSingleLetterHints");
		// For keyboard clicking we need to get rid of single letter hints so that
		// all hints are reachable
		const keyboardClicking = await retrieve("keyboardClicking");
		const possibleHints =
			includeSingleLetterHints && !keyboardClicking
				? [...allHints]
				: allHints.slice(0, -26);

		await saveStack(
			{
				free: possibleHints,
				assigned: new Map(),
			},
			tabId
		);
	}
}

export async function claimHints(
	amount: number,
	tabId: number,
	frameId: number
): Promise<string[]> {
	const stack = await getStack(tabId);

	const hints = stack.free.splice(-amount, amount);

	for (const hint of hints) {
		stack.assigned.set(hint, frameId);
	}

	await saveStack(stack, tabId);

	const hintsInTab = [...stack.assigned.keys()];
	await browser.tabs.sendMessage(tabId, {
		type: "updateHintsInTab",
		hints: hintsInTab,
	});
	return hints;
}

export async function reclaimHintsFromOtherFrames(
	tabId: number,
	frameId: number,
	amount: number
) {
	const stack = await getStack(tabId);
	const frames = await browser.webNavigation.getAllFrames({ tabId });
	const otherFramesIds = frames
		.map((frame) => frame.frameId)
		.filter((id) => id !== frameId);

	const reclaimed: string[] = [];

	for (const id of otherFramesIds) {
		// eslint-disable-next-line no-await-in-loop
		const reclaimedFromFrame = (await browser.tabs.sendMessage(
			tabId,
			{
				type: "reclaimHints",
				amount: amount - reclaimed.length,
			},
			{ frameId: id }
		)) as string[];

		reclaimed.push(...reclaimedFromFrame);

		// Once we have enough hints we don't need to continue sending messages to
		// other frames
		if (reclaimed.length === amount) break;
	}

	for (const hint of reclaimed) {
		stack.assigned.set(hint, frameId);
	}

	await saveStack(stack, tabId);

	const hintsInTab = [...stack.assigned.keys()];
	await browser.tabs.sendMessage(tabId, {
		type: "updateHintsInTab",
		hints: hintsInTab,
	});

	return reclaimed;
}

async function storeHintsInUse(
	hints: string[],
	tabId: number,
	frameId: number
) {
	const stack = await getStack(tabId);

	stack.free = stack.free.filter((value) => !hints.includes(value));

	for (const hint of hints) {
		stack.assigned.set(hint, frameId);
	}

	await saveStack(stack, tabId);
}

export async function releaseHints(hints: string[], tabId: number) {
	const stack = await getStack(tabId);
	// We make sure the hints to release are actually assigned
	const filteredHints = hints.filter((hint) => stack.assigned.has(hint));
	stack.free.push(...filteredHints);
	stack.free.sort((a, b) => b.length - a.length || b.localeCompare(a));

	for (const hint of filteredHints) {
		stack.assigned.delete(hint);
	}

	await saveStack(stack, tabId);
}

// We use onCommitted because onBeforeNavigate can sometimes be received repeated times.
// onCommitted is also guaranteed to be received before any of the subframes onBeforeNavigate
browser.webNavigation.onCommitted.addListener(async ({ tabId, frameId }) => {
	await mutex.runExclusive(async () => {
		if (frameId === 0) {
			await initStack(tabId, frameId);
		}

		// In chrome and safari, sometimes, when you hit the back or forward button
		// the content script is recovered instead of being started again. For that
		// reason we need to recover the hints that are in use and store them in
		// memory in its stack.
		let hintsInUse;
		try {
			hintsInUse = (await browser.tabs.sendMessage(
				tabId,
				{ type: "getHintStringsInUse" },
				{
					frameId,
				}
			)) as string[];
		} catch {
			// We do nothing here. The content script still hasn't loaded, so there's
			// no hints to store
		}

		if (hintsInUse) {
			await storeHintsInUse(hintsInUse, tabId, frameId);
		}
	});
});
