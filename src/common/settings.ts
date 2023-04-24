import Color from "color";
import { StorageSchema } from "../typings/StorageSchema";

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
	hintsToggleHosts: new Map(),
	hintsTogglePaths: new Map(),
	hintsToggleTabs: new Map(),
	enableNotifications: true,
	toastPosition: "top-center",
	toastTransition: "bounce",
	includeSingleLetterHints: true,
	urlInTitle: true,
	keyboardClicking: false,
	customSelectors: {},
	showWhatsNewPageOnUpdate: true,
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
	hintFontSize: (value: number) => isWithinRange(value, 6, 16),
	hintBorderRadius: (value: number) => isWithinRange(value, 0, 10),
	hintBorderWidth: (value: number) => isWithinRange(value, 0, 3),
	hintBackgroundOpacity: (value: number | "") =>
		value !== "" && isWithinRange(value, 0, 1),
	hintMinimumContrastRatio: (value: number) => isWithinRange(value, 2.5, 21),
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
	if (typeof validator === "undefined") return true;

	return validator(value);
}
