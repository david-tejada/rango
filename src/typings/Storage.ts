interface CustomSelectors {
	include: string[];
	exclude: string[];
}

export type HintsStack = {
	free: string[];
	assigned: Map<string, number>;
};

export interface Storage {
	hintFontSize: number;
	hintsToggleGlobal: boolean;
	hintsToggleHosts: Map<string, boolean>;
	hintsTogglePaths: Map<string, boolean>;
	hintsToggleTabs: Map<number, boolean>;
	hintWeight: "auto" | "normal" | "bold";
	hintStyle: "boxed" | "subtle";
	includeSingleLetterHints: boolean;
	urlInTitle: boolean;
	keyboardClicking: boolean;
	customSelectors: Record<string, CustomSelectors>;
	tabsByRecency: Record<number, number[]>;
	hintsStacks: Map<number, HintsStack>;
}

export type Options = Pick<
	Storage,
	| "hintFontSize"
	| "hintsToggleGlobal"
	| "hintsToggleHosts"
	| "hintsTogglePaths"
	| "hintsToggleTabs"
	| "hintWeight"
	| "hintStyle"
	| "includeSingleLetterHints"
	| "urlInTitle"
	| "keyboardClicking"
	| "customSelectors"
>;
