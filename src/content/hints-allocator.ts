import browser from "webextension-polyfill";
import { HintsStack, StorableHintsStack, ScriptContext } from "../types/types";
import { getStored, saveToStorage } from "../lib/storage";
import { allHints } from "./all-hints";

let tabId: number;
let frameId: number;

async function setScriptContext() {
	if (!tabId) {
		const context = await getScriptContext();
		tabId = context.tabId;
		frameId = context.frameId;
	}
}

export async function getScriptContext(): Promise<ScriptContext> {
	const context = (await browser.runtime.sendMessage({
		type: "request",
		action: {
			type: "getScriptContext",
		},
	})) as ScriptContext;

	return context;
}

export async function getStack(): Promise<HintsStack> {
	await setScriptContext();
	const newStack = {
		free: [...allHints],
		assigned: new Map(),
	};

	const storableStack = (await getStored(`hints-stack-${tabId}`)) as
		| StorableHintsStack
		| undefined;

	const stack = storableStack
		? {
				free: storableStack.free,
				assigned: new Map(storableStack.assigned),
		  }
		: newStack;

	return stack;
}

export async function saveStack(stack: HintsStack) {
	// console.log("Saving stack:", stack);
	// I cannot store a map directly in local storage, so I have to convert first
	// to something that is storable, like array
	const storableStack = {
		free: stack.free,
		assigned: Array.from(stack.assigned),
	};
	await saveToStorage({
		[`hints-stack-${tabId}`]: storableStack,
	});
}

export async function initStack() {
	console.log("Initiating stack");
	await saveStack({
		free: [...allHints],
		assigned: new Map(),
	});
}

export function claimHintText(stack: HintsStack): string | undefined {
	const hintText = stack.free.pop();
	if (hintText) {
		stack.assigned.set(hintText, frameId);
		console.log(`${hintText} claimed`);
	}

	return hintText ?? undefined;
}

export function releaseHintText(stack: HintsStack, hintText: string) {
	stack.free.push(hintText);
	stack.free.sort((a, b) => b.length - a.length || b.localeCompare(a));
	stack.assigned.delete(hintText);
	console.log(`${hintText} released`);
}
