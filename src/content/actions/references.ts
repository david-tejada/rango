import { getCssSelector } from "css-selector-generator";
import { getHostPattern } from "../../common/getHostPattern";
import { store } from "../../common/storage";
import { showTooltip } from "../hints/showTooltip";
import { getSetting } from "../settings/settingsManager";
import { getActiveElement } from "../utils/domUtils";
import {
	type ElementWrapper,
	getOrCreateWrapper,
} from "../wrappers/ElementWrapper";
import { getWrapperForElement } from "../wrappers/wrappers";

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

		if (wrapper) {
			// Sometimes focused elements have additional attributes that they do not
			// have when they are not focused. We need to blur the element so that
			// those classes don't affect the selector.
			if (wrapper.element instanceof HTMLElement) {
				wrapper.element.blur();
			}

			// We give it a little time to ensure that the element attributes have
			// been updated.
			setTimeout(async () => {
				await saveReference(wrapper, name);

				if (wrapper.element instanceof HTMLElement) {
					wrapper.element.focus();
				}
			}, 100);
		}
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

export async function getReferences() {
	const hostPattern = getHostPattern(window.location.href);
	const references = getSetting("references");
	const hostReferences =
		references.get(hostPattern) ?? new Map<string, string>();

	return { hostPattern, references, hostReferences };
}

function getWrapperFromUniqueSelector(selector: string) {
	const element = document.querySelector(selector);
	if (!element) return;

	return getOrCreateWrapper(element, false);
}
