export interface HintsToggle {
	global: boolean;
	tabs: Map<number, boolean>;
	hosts: Map<string, boolean>;
	paths: Map<string, boolean>;
}

export interface StorableHintsToggle {
	global: boolean;
	tabs: Array<[number, boolean]>;
	hosts: Array<[string, boolean]>;
	paths: Array<[string, boolean]>;
}
export interface RangoOptions {
	hintFontSize: number;
	hintsToggle: HintsToggle;
	hintWeight: "auto" | "normal" | "bold";
	hintStyle: "boxed" | "subtle";
	includeSingleLetterHints: boolean;
	urlInTitle: boolean;
	keyboardClicking: boolean;
}

export interface StorableRangoOptions {
	hintFontSize: number;
	hintsToggle: StorableHintsToggle;
	hintWeight: "auto" | "normal" | "bold";
	hintStyle: "boxed" | "subtle";
	includeSingleLetterHints: boolean;
	urlInTitle: boolean;
	keyboardClicking: boolean;
}
