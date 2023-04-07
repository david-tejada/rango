interface CustomSelectors {
	include: string[];
	exclude: string[];
}

export type HintsStack = {
	free: string[];
	assigned: Map<string, number>;
};

export interface StorageSchema {
	// Hint style
	hintUppercaseLetters: boolean;
	hintFontFamily: string;
	hintFontSize: number;
	hintWeight: "auto" | "normal" | "bold";
	hintBackgroundColor: string;
	hintBackgroundOpacity: number;
	hintFontColor: string;
	hintMinimumContrastRatio: number;
	hintBorderWidth: number;
	hintBorderRadius: number;

	// Hint characters
	includeSingleLetterHints: boolean;

	// Scroll
	scrollBehavior: "auto" | "smooth" | "instant";

	// Toggle
	hintsToggleGlobal: boolean;
	hintsToggleHosts: Map<string, boolean>;
	hintsTogglePaths: Map<string, boolean>;
	hintsToggleTabs: Map<number, boolean>;

	// Other settings
	urlInTitle: boolean;
	keyboardClicking: boolean;
	customSelectors: Record<string, CustomSelectors>;
	switchedToSyncStorage: boolean;

	// Other data
	tabsByRecency: Record<number, number[]>;
	hintsStacks: Map<number, HintsStack>;

	// Legacy
	hintsToggle: {
		global: boolean;
		tabs: Array<[number, boolean]>;
		hosts: Array<[string, boolean]>;
		paths: Array<[string, boolean]>;
	};
}
