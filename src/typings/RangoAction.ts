interface RangoActionWithoutTargetWithoutArg {
	type:
		| "closeOtherTabsInWindow"
		| "closeTabsToTheLeftInWindow"
		| "closeTabsToTheRightInWindow"
		| "cloneCurrentTab"
		| "moveCurrentTabToNewWindow"
		| "focusPreviousTab"
		| "unhoverAll"
		| "copyCurrentTabMarkdownUrl"
		| "scrollUpAtElement"
		| "scrollDownAtElement"
		| "scrollLeftAtElement"
		| "scrollRightAtElement"
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
export interface RangoActionWithoutTargetWithNumberArg {
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
		| "scrollLeftAtElement"
		| "scrollRightAtElement";
	target: string;
	arg?: number;
}
interface RangoActionWithoutTargetWithOptionalNumberArg {
	type:
		| "scrollUpPage"
		| "scrollDownPage"
		| "scrollLeftPage"
		| "scrollRightPage"
		| "scrollUpLeftAside"
		| "scrollDownLeftAside"
		| "scrollUpRightAside"
		| "scrollDownRightAside";
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
