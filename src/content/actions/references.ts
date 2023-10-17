import { getCssSelector } from "css-selector-generator";
import { retrieve, store } from "../../common/storage";
import { ElementWrapper } from "../../typings/ElementWrapper";
import { getHostPattern } from "../hints/customSelectorsStaging";
import { showTooltip } from "../hints/showTooltip";
import { getOrCreateWrapper } from "../wrappers/ElementWrapperClass";
import { notify } from "../notify/notify";

export async function getReferencesForCurrentUrl() {
	const hostPattern = getHostPattern();
	const references = await retrieve("references");

	return references.get(hostPattern) ?? new Map<string, string>();
}

export function getWrapperFromUniqueSelector(selector: string) {
	const element = document.querySelector(selector);
	if (!element) return;

	return getOrCreateWrapper(element, false);
}

export async function saveReference(wrapper: ElementWrapper, name: string) {
	const hostPattern = getHostPattern();
	const references = await retrieve("references");
	const referencesForPattern =
		references.get(hostPattern) ?? new Map<string, string>();

	const uniqueSelector = getCssSelector(wrapper.element, {
		blacklist: [/data-hint/],
	});

	referencesForPattern.set(name, uniqueSelector);
	references.set(hostPattern, referencesForPattern);
	await store("references", references);

	showTooltip(wrapper, name, 5000);
}

export async function showReferences(duration = 3000) {
	const referencesForUrl = await getReferencesForCurrentUrl();

	const showing = [...referencesForUrl.entries()].map(
		async ([name, selector]) => {
			const wrapper = getWrapperFromUniqueSelector(selector);
			if (wrapper) {
				showTooltip(wrapper, name, duration);
			}
		}
	);

	await Promise.all(showing);
}

export async function removeReference(name: string) {
	const referencesForUrl = await getReferencesForCurrentUrl();

	if (!referencesForUrl?.has(name)) {
		await notify(`Reference "${name}" is not saved in the current context`, {
			type: "error",
		});
		return;
	}

	const selector = referencesForUrl.get(name);

	if (!selector) {
		await notify(`Unable to find reference "${name}"`);
		return;
	}

	referencesForUrl.delete(name);
	const references = await retrieve("references")!;
	references.set(getHostPattern(), referencesForUrl);

	await store("references", references);

	const wrapper = getWrapperFromUniqueSelector(selector);
	if (wrapper) showTooltip(wrapper, `❌ ${name}`, 2000);
}
