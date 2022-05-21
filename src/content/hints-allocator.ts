import { HintsStack, StorableHintsStack } from "../types/types";
import { getStored, saveToStorage } from "../lib/storage";
import { getScriptEnvironment } from "./environment";
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

export async function getStack(): Promise<HintsStack> {
	const { tabId } = await getScriptEnvironment();

	const storableStack = (await getStored(`hints-stack-${tabId}`)) as
		| StorableHintsStack
		| undefined;

	if (!storableStack) {
		const newStack = {
			free: [...allHints],
			assigned: new Map(),
		};
		await saveStack(newStack);
		return newStack;
	}

	return stackFromStorable(storableStack);
}

async function saveStack(stack: HintsStack) {
	console.log("saveStack called");
	const { tabId } = await getScriptEnvironment();
	console.log(`Saving stack hints-stack-${tabId}`);
	try {
		await saveToStorage({
			[`hints-stack-${tabId}`]: stackToStorable(stack),
		});
	} catch (error: unknown) {
		console.error(error);
	}

	console.log("Stack saved");
}

export async function initStack() {
	const { frameId } = await getScriptEnvironment();
	console.log("initStack called");
	console.trace();

	if (frameId === 0) {
		await saveStack({
			free: [...allHints],
			assigned: new Map(),
		});
	}
}

export async function claimHints(amount: number): Promise<string[]> {
	const { frameId } = await getScriptEnvironment();
	const stack = await getStack();

	const hints = stack.free.splice(-amount, amount);

	console.log("Claimed hints:", hints.join(", "));

	for (const hint of hints) {
		stack.assigned.set(hint, frameId);
	}

	console.log(
		"stack:\n",
		"free:",
		stack.free.join(", "),
		"\nassigned:",
		JSON.stringify(stack.assigned)
	);

	await saveStack(stack);

	return hints;
}

export async function releaseHints(hints: string[]) {
	console.log("Released:", hints);
	const stack = await getStack();
	// We make sure the hints to release are actually assigned
	const filteredHints = hints.filter((hint) => stack.assigned.has(hint));
	stack.free.push(...filteredHints);
	stack.free.sort((a, b) => b.length - a.length || b.localeCompare(a));

	for (const hint of filteredHints) {
		stack.assigned.delete(hint);
	}

	await saveStack(stack);
}

export async function releaseOtherHints(hints: string[]) {
	const otherHints = allHints.filter((hint) => !hints.includes(hint));
	await releaseHints(otherHints);
}
