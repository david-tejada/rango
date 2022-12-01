const defaultSelector =
	// Elements
	"button, a, input, summary, textarea, select, option, label, " +
	// Roles
	"[role='button'], [role='link'], [role='treeitem'], [role='tab'], [role='option'], " +
	"[role='radio'], [role='checkbox'], [role='menuitem'], [role='menuitemradio'], [role='menuitemcheckbox'], " +
	// Attributes
	"[contenteditable='true'], [contenteditable='']";

// To be populated from local storage
const includeSelectors: string[] = [];
const excludeSelectors: string[] = [];

let includeSelectorAll = "";
let excludeSelectorAll = "";

for (const [index, selector] of includeSelectors.entries()) {
	if (index !== 0) {
		includeSelectorAll += ", ";
	}

	includeSelectorAll += selector;
}

for (const [index, selector] of excludeSelectors.entries()) {
	if (index !== 0) {
		excludeSelectorAll += ", ";
	}

	excludeSelectorAll += selector;
}

const notSelector =
	":not([aria-hidden='true']" +
	(excludeSelectorAll ? `, ${excludeSelectorAll}` : "") +
	")";

const hintableSelector =
	`:is(${defaultSelector})${notSelector}` +
	(includeSelectorAll ? `, ${includeSelectorAll}` : "");

function hasSignificantSiblings(target: Node) {
	if (!target.parentNode) return false;

	const significantSiblingsIncludingSelf = [
		...target.parentNode.childNodes,
	].filter(
		(node) =>
			node instanceof Element ||
			(node instanceof Text && node.textContent && /\S/.test(node.textContent))
	);

	return significantSiblingsIncludingSelf.length > 1;
}

function isRedundant(target: Element) {
	if (
		!hasSignificantSiblings(target) &&
		target.parentElement!.matches(hintableSelector) &&
		!(includeSelectorAll && target.matches(includeSelectorAll))
	) {
		return true;
	}

	return false;
}

export function isHintable(target: Element): boolean {
	return target.matches(hintableSelector) && !isRedundant(target);
}
