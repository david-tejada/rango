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
	`:not([aria-hidden='true'], :is(${defaultSelector}) > *:only-child` +
	(excludeSelectorAll ? `, ${excludeSelectorAll}` : "") +
	")";

const hintableSelector =
	`:is(${defaultSelector})${notSelector}` +
	(includeSelectorAll ? `, ${includeSelectorAll}` : "");

export function isHintable(target: Element): boolean {
	return target.matches(hintableSelector);
}
