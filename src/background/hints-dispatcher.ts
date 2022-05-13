import { HintsStack } from "../types/types";
import { hintStack } from "../lib/hint-stack";

const hintsStacks: HintsStack[] = [];

function getHintsStack(tabId: number): HintsStack | undefined {
	return hintsStacks.find((hintStack) => hintStack.tabId === tabId);
}

export function getHintFrameId(tabId: number, hintText: string): number {
	const hintsStack = getHintsStack(tabId);
	if (hintsStack) {
		return hintsStack.assigned.get(hintText) ?? 0;
	}

	return 0;
}

export function addNewHintsStack(tabId: number) {
	hintsStacks.push({
		tabId,
		free: [...hintStack],
		assigned: new Map<string, number>(),
	});
}

export function claimHintText(
	tabId: number,
	frameId: number
): string | undefined {
	const hintsStack = getHintsStack(tabId);
	const hintText = hintsStack?.free.pop();
	if (hintText) {
		hintsStack?.assigned.set(hintText, frameId);
	}

	return hintText ?? undefined;
}

export function releaseHintText(tabId: number, hintText: string) {
	const hintsStack = getHintsStack(tabId);
	hintsStack?.free.push(hintText);
	hintsStack?.free.sort((a, b) => b.length - a.length || b.localeCompare(a));
	console.log(hintsStack?.free);
	hintsStack?.assigned.delete(hintText);
}
