import { HintsStack, StorableHintsStack } from "../typing/types";
import { getStored, setStored } from "../lib/storage";
import { allHints } from "./all-hints";

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
		await saveStack(
			{
				free: [...allHints],
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
