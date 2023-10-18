import { getCssSelector } from "css-selector-generator";
import { retrieve, store } from "../../common/storage";
import { ElementWrapper } from "../../typings/ElementWrapper";
import { getHostPattern } from "../hints/customSelectorsStaging";
import { showTooltip } from "../hints/showTooltip";
import { getOrCreateWrapper } from "../wrappers/ElementWrapperClass";
import { notify } from "../notify/notify";

function getWrapperFromUniqueSelector(selector: string) {
	const element = document.querySelector(selector);
	if (!element) return;

	return getOrCreateWrapper(element, false);
}

/** Executes the given callback with the references for the current URL and
 * updates references after. */
export async function withHostReferences(
	callback: (hostReferences: Map<string, string>) => void | Promise<void>
) {
	const hostPattern = getHostPattern();
	const references = await retrieve("references");
	const hostReferences =
		references.get(hostPattern) ?? new Map<string, string>();

	await Promise.resolve(callback(hostReferences));

	references.set(hostPattern, hostReferences);
	await store("references", references);
}

export async function saveReference(wrapper: ElementWrapper, name: string) {
	const uniqueSelector = getCssSelector(wrapper.element, {
		blacklist: [/data-hint/],
	});

	await withHostReferences((hostReferences) => {
		hostReferences.set(name, uniqueSelector);
	});

	showTooltip(wrapper, name, 5000);
}

export async function showReferences(duration = 3000) {
	await withHostReferences(async (hostReferences) => {
		const showing = [...hostReferences.entries()].map(
			async ([name, selector]) => {
				const wrapper = getWrapperFromUniqueSelector(selector);
				if (wrapper) {
					showTooltip(wrapper, name, duration);
				}
			}
		);

		await Promise.all(showing);
	});
}

export async function removeReference(name: string) {
	await withHostReferences(async (hostReferences) => {
		const selector = hostReferences.get(name);

		if (!selector) {
			return notify(`Unable to find reference "${name}"`, { type: "error" });
		}

		hostReferences.delete(name);

		const wrapper = getWrapperFromUniqueSelector(selector);
		if (wrapper) showTooltip(wrapper, `❌ ${name}`, 2000);
	});
}
