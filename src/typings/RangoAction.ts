interface RangoActionWithoutTargetWithoutArg {
	type:
		| "closeOtherTabsInWindow"
		| "closeTabsToTheLeftInWindow"
		| "closeTabsToTheRightInWindow"
		| "cloneCurrentTab"
		| "moveCurrentTabToNewWindow"
		| "unhoverAll"
		| "copyCurrentTabMarkdownUrl"
		| "toggleHints"
		| "toggleKeyboardClicking"
		| "enableHintsNavigation"
		| "disableHintsNavigation"
		| "excludeSingleLetterHints"
		| "includeSingleLetterHints"
		| "refreshHints"
		| "enableUrlInTitle"
		| "disableUrlInTitle"
		| "fullHintsUpdate"
		| "fullHintsUpdateOnIdle"
		| "increaseHintSize"
		| "decreaseHintSize";
}
interface RangoActionWithoutTargetWithStringArg {
	type:
		| "copyLocationProperty"
		| "setHintStyle"
		| "setHintWeight"
		| "enableHints"
		| "disableHints"
		| "resetToggleLevel";
	arg: string;
}
interface RangoActionWithoutTargetWithNumberArg {
	type:
		| "closeTabsLeftEndInWindow"
		| "closeTabsRightEndInWindow"
		| "closePreviousTabsInWindow"
		| "closeNextTabsInWindow";
	arg: number;
}
interface RangoActionWithTargetWithOptionalNumberArg {
	type:
		| "scrollUpAtElement"
		| "scrollDownAtElement"
		| "scrollUpPage"
		| "scrollDownPage";
	target: string;
	arg?: number;
}
interface RangoActionWithoutTargetWithOptionalNumberArg {
	type: "scrollUpPage" | "scrollDownPage";
	arg?: number;
}
interface RangoActionWithSingleTarget {
	type:
		| "scrollElementToTop"
		| "scrollElementToBottom"
		| "scrollElementToCenter";
	target: string;
}
interface RangoActionWithMultipleTargets {
	type:
		| "openInBackgroundTab"
		| "clickElement"
		| "directClickElement"
		| "openInNewTab"
		| "copyLink"
		| "copyMarkdownLink"
		| "copyElementTextContent"
		| "showLink"
		| "hoverElement";
	target: string[];
}

export type RangoActionWithTarget =
	| RangoActionWithSingleTarget
	| RangoActionWithMultipleTargets
	| RangoActionWithTargetWithOptionalNumberArg;

export type RangoActionWithoutTarget =
	| RangoActionWithoutTargetWithoutArg
	| RangoActionWithoutTargetWithStringArg
	| RangoActionWithoutTargetWithNumberArg
	| RangoActionWithoutTargetWithOptionalNumberArg;

export type RangoAction = RangoActionWithTarget | RangoActionWithoutTarget;
