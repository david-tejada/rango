import Color from "color";
import { z } from "zod";

const zCustomSelector = z.object({
	pattern: z.string(),
	type: z.enum(["include", "exclude"]),
	selector: z.string(),
});

export type CustomSelector = z.infer<typeof zCustomSelector>;

const zSafeString = z
	.string()
	.refine((value) => !(value.startsWith('"') && value.endsWith('"')));

export const zSettings = z.object({
	// Hint style
	hintUppercaseLetters: z.boolean().default(false),
	hintFontFamily: zSafeString.default(
		"source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace"
	),
	hintFontSize: z
		.number()
		.default(10)
		.refine((value) => isWithinRange(value, 1, 72)),
	hintWeight: z.enum(["auto", "normal", "bold"]).default("auto"),
	hintBackgroundColor: zSafeString.default("").refine(isValidColor),
	hintBackgroundOpacity: z
		.number()
		.default(1)
		.refine((value) => isWithinRange(value, 0, 1)),
	hintFontColor: zSafeString.default("").refine(isValidColor),
	hintMinimumContrastRatio: z
		.number()
		.default(4)
		.refine((value) => isWithinRange(value, 2.5, 21)),
	hintBorderWidth: z
		.number()
		.default(1)
		.refine((value) => isWithinRange(value, 0, 72)),
	hintBorderRadius: z
		.number()
		.default(3)
		.refine((value) => isWithinRange(value, 0, 72)),

	// Hint characters
	includeSingleLetterHints: z.boolean().default(true),
	useNumberHints: z.boolean().default(false),
	hintsToExclude: zSafeString.default(""),

	// Hintable area
	viewportMargin: z
		.number()
		.default(1000)
		.refine((value) => isWithinRange(value, 0, 2000)),

	// Scroll
	scrollBehavior: z.enum(["auto", "smooth", "instant"]).default("auto"),

	// Toggle
	hintsToggleGlobal: z.boolean().default(true),
	hintsToggleHosts: z.map(z.string(), z.boolean()).default(new Map()),
	hintsTogglePaths: z.map(z.string(), z.boolean()).default(new Map()),
	hintsToggleTabs: z.map(z.number(), z.boolean()).default(new Map()),

	// Always compute hintables
	alwaysComputeHintables: z.boolean().default(false),

	// Notifications
	enableNotifications: z.boolean().default(true),
	notifyWhenTogglingHints: z.boolean().default(false),
	toastPosition: z
		.enum([
			"top-right",
			"top-center",
			"top-left",
			"bottom-right",
			"bottom-center",
			"bottom-left",
		])
		.default("top-center"),
	toastTransition: z
		.enum(["slide", "flip", "zoom", "bounce"])
		.default("bounce"),
	toastDuration: z.number().default(5000),

	// Other settings
	urlInTitle: z.boolean().default(true),
	includeTabMarkers: z.boolean().default(true),
	hideTabMarkersWithGlobalHintsOff: z.boolean().default(false),
	uppercaseTabMarkers: z.boolean().default(true),
	keyboardClicking: z.boolean().default(false),
	keysToExclude: z.array(z.tuple([z.string(), z.string()])).default([]),
	customSelectors: z.array(zCustomSelector).default([]),
	customScrollPositions: z
		.map(z.string(), z.map(z.string(), z.number()))
		.default(new Map()),
	references: z
		.map(z.string(), z.map(z.string(), z.string()))
		.default(new Map()),
	showWhatsNewPageOnUpdate: z.boolean().default(true),
	newTabPosition: z
		.enum(["relatedAfterCurrent", "afterCurrent", "atEnd"])
		.default("relatedAfterCurrent"),
	hasSeenSettingsPage: z.boolean().default(false),
	directClickWithNoFocusedDocument: z.boolean().default(false),
	directClickWhenEditing: z.boolean().default(true),
});

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

export type Settings = z.infer<typeof zSettings>;
