import browser from "webextension-polyfill";
import { HintsStack, StorableHintsStack } from "../../typings/HintsStack";
import { getStored, setStored } from "../../lib/getStored";
import { allHints } from "./allHints";

function stackToStorable(stack: HintsStack): StorableHintsStack {
	return {
		free: stack.free,
		assigned: Array.from(stack.assigned),
	};
}

function stackFromStorable(storableStack: StorableHintsStack): HintsStack {
	return {
		free: storableStack.free,
		assigned: new Map(storableStack.assigned),
	};
}

export async function getStack(tabId: number): Promise<HintsStack> {
	const storableStack = (await getStored(`hints-stack-${tabId}`)) as
		| StorableHintsStack
		| undefined;

	if (!storableStack) {
		const newStack = {
			free: [...allHints],
			assigned: new Map(),
		};
		await saveStack(newStack, tabId);
		return newStack;
	}

	return stackFromStorable(storableStack);
}

async function saveStack(stack: HintsStack, tabId: number) {
	try {
		await setStored({
			[`hints-stack-${tabId}`]: stackToStorable(stack),
		});
	} catch (error: unknown) {
		console.error(error);
	}
}

export async function initStack(tabId: number, frameId: number) {
	if (frameId === 0) {
		const includeSingleLetterHints = await getStored(
			"includeSingleLetterHints"
		);
		// For keyboard clicking we need to get rid of single letter hints so that
		// all hints are reachable
		const keyboardClicking = await getStored("keyboardClicking");
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

export async function releaseOrphanHints(
	activeHints: string[],
	tabId: number,
	frameId: number
) {
	const stack = await getStack(tabId);
	const orphanHints = Array.from(stack.assigned.keys()).filter(
		(hint) =>
			!activeHints.includes(hint) && stack.assigned.get(hint) === frameId
	);
	await releaseHints(orphanHints, tabId);
}

// We use onCommitted because onBeforeNavigate can sometimes be received repeated times.
// onCommitted is also guaranteed to be received before any of the subframes onBeforeNavigate
browser.webNavigation.onCommitted.addListener(async ({ frameId, tabId }) => {
	if (frameId === 0) {
		await initStack(tabId, frameId);
	}
});
