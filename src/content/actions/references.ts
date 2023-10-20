import browser from "webextension-polyfill";
import { getCssSelector } from "css-selector-generator";
import { retrieve, store } from "../../common/storage";
import { ElementWrapper } from "../../typings/ElementWrapper";
import { getHostPattern } from "../hints/customSelectorsStaging";
import { showTooltip } from "../hints/showTooltip";
import { getOrCreateWrapper } from "../wrappers/ElementWrapperClass";

function getWrapperFromUniqueSelector(selector: string) {
	const element = document.querySelector(selector);
	if (!element) return;

	return getOrCreateWrapper(element, false);
}

export async function getReferences() {
	const hostPattern = getHostPattern();
	const references = await retrieve("references");
	const hostReferences =
		references.get(hostPattern) ?? new Map<string, string>();

	return { hostPattern, references, hostReferences };
}

export async function saveReference(wrapper: ElementWrapper, name: string) {
	const uniqueSelector = getCssSelector(wrapper.element, {
		blacklist: [/data-hint/],
		maxCombinations: 100,
		includeTag: true,
	});

	const { hostPattern, references, hostReferences } = await getReferences();
	hostReferences.set(name, uniqueSelector);
	references.set(hostPattern, hostReferences);
	await store("references", references);

	showTooltip(wrapper, name);
}

export async function showReferences() {
	const { hostReferences } = await getReferences();

	for (const [name, selector] of hostReferences.entries()) {
		const wrapper = getWrapperFromUniqueSelector(selector);
		if (wrapper) showTooltip(wrapper, name);
	}
}

export async function removeReference(name: string) {
	const { hostPattern, hostReferences } = await getReferences();
	const selector = hostReferences.get(name);

	if (!selector) return false;

	await browser.runtime.sendMessage({
		type: "removeReference",
		hostPattern,
		name,
	});

	const wrapper = getWrapperFromUniqueSelector(selector);
	if (wrapper) showTooltip(wrapper, `❌ ${name}`);

	return true;
}
