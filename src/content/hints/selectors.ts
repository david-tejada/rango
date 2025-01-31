import { onDocumentVisible } from "../dom/whenVisible";
import { getSetting, onSettingChange } from "../settings/settingsManager";
import { refresh } from "../wrappers/refresh";

const defaultSelector =
	// Elements
	"button, a, input, summary, textarea, select, label, " +
	// Roles
	"[role='button'], [role='link'], [role='treeitem'], [role='tab'], [role='option'], " +
	"[role='radio'], [role='checkbox'], [role='menuitem'], [role='menuitemradio'], [role='menuitemcheckbox'], " +
	// Attributes
	"[contenteditable='true'], [contenteditable='']";

const hintableSelector = `:is(${defaultSelector}):not([aria-hidden='true'], .Toastify__close-button)`;

export const extraSelector = `:is(${defaultSelector}, [aria-hidden='true'], div, span, i, li, td, p, h1, h2, h3, h4, h5, h6):not(#rango-toast *)`;

let includeSelectorAll = "";
let excludeSelectorAll = "";

/**
 * Updates the variables `includeSelectorAll` and `excludeSelectorAll` that are
 * used when checking if an element should be hinted.
 */
export function updateCustomSelectors() {
	const customSelectors = getSetting("customSelectors");

	const include: string[] = [];
	const exclude: string[] = [];

	for (const { pattern, type, selector } of customSelectors) {
		const patternRe = new RegExp(pattern);

		if (patternRe.test(location.href)) {
			if (type === "include") {
				include.push(selector);
			} else {
				exclude.push(selector);
			}
		}
	}

	includeSelectorAll = include.join(", ");
	excludeSelectorAll = exclude.join(", ");
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

export function getHintableSelector() {
	const baseSelector = `:is(${hintableSelector})`;
	const excludeClause = excludeSelectorAll ? `:not(${excludeSelectorAll})` : "";
	const includeClause = includeSelectorAll ? `, ${includeSelectorAll}` : "";

	return `${baseSelector}${excludeClause}${includeClause}`;
}

export function matchesExtraSelector(target: Element) {
	return target.matches(extraSelector);
}

async function handleCustomSelectorsChange() {
	updateCustomSelectors();
	await refresh({ isHintable: true });
}

onSettingChange("customSelectors", async () => {
	onDocumentVisible(handleCustomSelectorsChange);
});
