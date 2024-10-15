import { getCssSelector } from "css-selector-generator";
import { sendMessage } from "webext-bridge/content-script";
import { store } from "../../common/storage";
import { getHostPattern } from "../../common/utils";
import { type ElementWrapper } from "../../typings/ElementWrapper";
import { showTooltip } from "../hints/showTooltip";
import { getSetting } from "../settings/settingsManager";
import { getActiveElement } from "../utils/domUtils";
import { getOrCreateWrapper } from "../wrappers/ElementWrapperClass";
import { getWrapperForElement } from "../wrappers/wrappers";

function getWrapperFromUniqueSelector(selector: string) {
	const element = document.querySelector(selector);
	if (!element) return;

	return getOrCreateWrapper(element, false);
}

export async function getReferences() {
	const hostPattern = getHostPattern(window.location.href);
	const references = getSetting("references");
	const hostReferences =
		references.get(hostPattern) ?? new Map<string, string>();

	return { hostPattern, references, hostReferences };
}

export async function saveReference(wrapper: ElementWrapper, name: string) {
	const uniqueSelector = getCssSelector(wrapper.element, {
		// Ignore id selectors as I have found some instances where they are
		// generated dynamically and can change after a refresh
		blacklist: [/data-hint/, /href/, "#*"],
		maxCombinations: 100,
		includeTag: true,
	});

	const { hostPattern, references, hostReferences } = await getReferences();
	hostReferences.set(name, uniqueSelector);
	references.set(hostPattern, hostReferences);
	await store("references", references);

	showTooltip(wrapper, name);
}

export async function saveReferenceForActiveElement(name: string) {
	const activeElement = getActiveElement();
	if (activeElement) {
		const wrapper = getWrapperForElement(activeElement);
		if (wrapper) await saveReference(wrapper, name);
	}
}

export async function showReferences() {
	const { hostReferences } = await getReferences();

	console.log("Rango references for the current host:");

	for (const [name, selector] of hostReferences.entries()) {
		const wrapper = getWrapperFromUniqueSelector(selector);
		if (wrapper) showTooltip(wrapper, name);
		console.log(`%c  ${name}:%c "${selector}"`, "font-weight: bold");
	}
}

export async function removeReference(name: string) {
	const { hostPattern, hostReferences } = await getReferences();
	const selector = hostReferences.get(name);

	if (!selector) return false;

	await sendMessage("removeReference", { hostPattern, name }, "background");

	const wrapper = getWrapperFromUniqueSelector(selector);
	if (wrapper) showTooltip(wrapper, `❌ ${name}`);

	return true;
}
