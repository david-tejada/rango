import Color from "color";
import {
	type CustomSelector,
	type StorageSchema,
} from "../../typings/StorageSchema";

export const defaultSettings = {
	hintUppercaseLetters: false,
	hintFontFamily:
		"source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace",
	hintFontSize: 10,
	hintWeight: "auto",
	hintBackgroundColor: "",
	hintBackgroundOpacity: 1,
	hintFontColor: "",
	hintBorderWidth: 1,
	hintBorderRadius: 3,
	hintMinimumContrastRatio: 4,
	scrollBehavior: "auto",
	hintsToggleGlobal: true,
	hintsToggleHosts: new Map<string, boolean>(),
	hintsTogglePaths: new Map<string, boolean>(),
	hintsToggleTabs: new Map<number, boolean>(),
	alwaysComputeHintables: false,
	enableNotifications: true,
	notifyWhenTogglingHints: false,
	toastPosition: "top-center",
	toastTransition: "bounce",
	toastDuration: 5000,
	includeSingleLetterHints: true,
	useNumberHints: false,
	hintsToExclude: "",
	viewportMargin: 1000,
	urlInTitle: true,
	includeTabMarkers: true,
	hideTabMarkersWithGlobalHintsOff: false,
	uppercaseTabMarkers: true,
	keyboardClicking: false,
	keysToExclude: new Array<[string, string]>(),
	customSelectors: new Array<CustomSelector>(),
	customScrollPositions: new Map<string, Map<string, number>>(),
	references: new Map<string, Map<string, string>>(),
	showWhatsNewPageOnUpdate: true,
	newTabPosition: "relatedAfterCurrent",
	hasSeenSettingsPage: false,
	directClickWithNoFocusedDocument: false,
	directClickWhenEditing: true,
} as const;

export type Settings = {
	-readonly [T in keyof typeof defaultSettings]: StorageSchema[T];
};

export const defaultSettingsMutable: Settings = { ...defaultSettings };

function isValidColor(colorString: string) {
	// An empty string means the color is automatically calculated
	if (!colorString) return true;

	try {
		// eslint-disable-next-line no-new
		new Color(colorString);
	} catch {
		return false;
	}

	return true;
}

function isWithinRange(value: number, min: number, max: number) {
	return value >= min && value <= max;
}

type SettingsValidators = {
	[T in keyof StorageSchema]?: (value: StorageSchema[T]) => boolean;
};

const validators: SettingsValidators = {
	hintBackgroundColor: isValidColor,
	hintFontColor: isValidColor,
	hintFontSize: (value: number) => isWithinRange(value, 1, 72),
	hintBorderRadius: (value: number) => isWithinRange(value, 0, 72),
	hintBorderWidth: (value: number) => isWithinRange(value, 0, 72),
	hintBackgroundOpacity: (value: number | "") =>
		value !== "" && isWithinRange(value, 0, 1),
	hintMinimumContrastRatio: (value: number) => isWithinRange(value, 2.5, 21),
	viewportMargin: (value: number) => isWithinRange(value, 0, 2000),
};

export function isSetting<T extends keyof StorageSchema>(key: T) {
	return key in defaultSettings;
}

export function isValidSetting<T extends keyof StorageSchema>(
	key: T,
	value: StorageSchema[T]
) {
	if (!isSetting(key)) return false;

	const validator = validators[key];
	if (validator === undefined) return true;

	return validator(value);
}
