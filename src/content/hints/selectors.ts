import browser from "webextension-polyfill";
import { assertDefined } from "../../typings/TypingUtils";

interface CustomSelectors {
	include: string[];
	exclude: string[];
}

const defaultSelector =
	// Elements
	"button, a, input, summary, textarea, select, option, label, " +
	// Roles
	"[role='button'], [role='link'], [role='treeitem'], [role='tab'], [role='option'], " +
	"[role='radio'], [role='checkbox'], [role='menuitem'], [role='menuitemradio'], [role='menuitemcheckbox'], " +
	// Attributes
	"[contenteditable='true'], [contenteditable='']";

const hintableSelector = `:is(${defaultSelector}):not([aria-hidden='true']`;

export const extraSelector = "div, span, h1, h2, h3, h4, h5, h6";

let includeSelectorAll = "";
let excludeSelectorAll = "";

export async function updateCustomSelectors() {
	const { customSelectors } = (await browser.storage.local.get(
		"customSelectors"
	)) as Record<string, Record<string, CustomSelectors>>;

	assertDefined(customSelectors);

	let includeSelectors: string[] = [];
	let excludeSelectors: string[] = [];

	for (const [key, value] of Object.entries(customSelectors)) {
		const re = new RegExp(key);
		if (re.test(window.location.href)) {
			includeSelectors = value.include;
			excludeSelectors = value.exclude;
		}
	}

	includeSelectorAll = includeSelectors.join(", ");
	excludeSelectorAll = excludeSelectors.join(", ");
}

export function getExcludeSelectorAll() {
	return excludeSelectorAll;
}

export function matchesCustomInclude(target: Element) {
	return includeSelectorAll && target.matches(includeSelectorAll);
}

export function matchesCustomExclude(target: Element) {
	return excludeSelectorAll && target.matches(excludeSelectorAll);
}

export function matchesHintableSelector(target: Element) {
	return target.matches(hintableSelector);
}

export function matchesExtraSelector(target: Element) {
	return target.matches(extraSelector);
}
