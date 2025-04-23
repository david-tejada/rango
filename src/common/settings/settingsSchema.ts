import Color from "colorjs.io";
import { z } from "zod";
import { isValidRegExp } from "../isValidRegExp";
import { isValidSelector } from "../isValidSelector";

const zCustomSelector = z.object({
	pattern: z.string(),
	type: z.enum(["include", "exclude"]),
	selector: z.string(),
});

export type CustomSelector = z.infer<typeof zCustomSelector>;

/**
 * Strings used to be serialized so it resulted in a double string like `""`. We
 * need to make sure we don't accept those values.
 */
const zSafeString = z
	.string()
	.refine((value) => !(value.startsWith('"') && value.endsWith('"')));

export const settingsSchema = z.object({
	// Hint style
	hintUppercaseLetters: z.boolean().default(false),
	hintFontFamily: zSafeString.default(
		"source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace"
	),
	hintFontSize: z
		.number()
		.default(12)
		.refine((value) => isWithinRange(value, 1, 72), {
			message: "Choose a font size between 1 and 72. Default value is 12.",
		}),

	// Deprecated in favour of hintFontBold. 2025-03-27
	hintWeight: z.enum(["auto", "normal", "bold"]).default("auto"),
	hintFontBold: z.boolean().default(true),
	hintBackgroundColor: zSafeString.default("").refine(isValidColor),
	hintBackgroundOpacity: z
		.number()
		.default(1)
		.refine(
			(value) => isWithinRange(value, 0, 1),
			"Opacity must be between 0 and 1. Default value is 1."
		),

	hintFontColor: zSafeString.default("").refine(isValidColor),
	// Deprecated in favour of hintEnhancedContrast. 2025-03-27
	hintMinimumContrastRatio: z
		.number()
		.default(4)
		.refine(
			(value) => isWithinRange(value, 2.5, 21),
			"Contrast must be between 2.5 and 21. Default value is 4."
		),
	hintEnhancedContrast: z.boolean().default(false),
	hintBorderWidth: z
		.number()
		.default(1)
		.refine(
			(value) => isWithinRange(value, 0, 72),
			"Border width must be less than 72. Default value is 1."
		),

	hintBorderRadius: z
		.number()
		.default(3)
		.refine(
			(value) => isWithinRange(value, 0, 72),
			"Border radius must be less than 72. Default value is 3."
		),

	// Hint characters
	includeSingleLetterHints: z.boolean().default(true),
	useNumberHints: z.boolean().default(false),
	hintsToExclude: zSafeString.default(""),

	// Hintable area
	viewportMargin: z
		.number()
		.default(1000)
		.refine(
			(value) => isWithinRange(value, 0, 2000),
			"Viewport margin must be less than 2000. Default value is 1000."
		),

	// Scroll
	scrollBehavior: z.enum(["auto", "smooth", "instant"]).default("auto"),

	// Toggle
	hintsToggleGlobal: z.boolean().default(true),
	hintsToggleHosts: z.record(z.string(), z.boolean()).default({}),
	hintsTogglePaths: z.record(z.string(), z.boolean()).default({}),
	// Tab ids are actually numbers but object keys can only be strings
	hintsToggleTabs: z.record(z.string(), z.boolean()).default({}),

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
	toastDuration: z
		.number()
		.min(500, "Duration must be greater than 500. Default value is 5000.")
		.default(5000),

	// Other settings
	urlInTitle: z.boolean().default(true),
	includeTabMarkers: z.boolean().default(true),
	hideTabMarkersWithGlobalHintsOff: z.boolean().default(false),
	uppercaseTabMarkers: z.boolean().default(true),
	keyboardClicking: z.boolean().default(false),
	keysToExclude: z
		.array(z.tuple([z.string(), z.string()]))
		.default([])
		.transform((value) => value.filter(([pattern]) => pattern)),
	customSelectors: z
		.array(zCustomSelector)
		.default([])
		.transform((value) => {
			return (
				value
					.filter(
						({ pattern, selector }) =>
							isValidRegExp(pattern) && isValidSelector(selector)
					)
					// Sorting for when we display the setting in the settings page
					.sort(
						(a, b) =>
							a.pattern.localeCompare(b.pattern) ||
							(a.type === "include" ? -1 : 1)
					)
			);
		}),
	customScrollPositions: z
		.record(z.string(), z.record(z.string(), z.number()))
		.default({}),
	references: z
		.record(z.string(), z.record(z.string(), z.string()))
		.default({}),
	showWhatsNewPageOnUpdate: z.boolean().default(true),
	newTabPosition: z
		.enum(["relatedAfterCurrent", "afterCurrent", "atEnd"])
		.default("relatedAfterCurrent"),
	directClickWithNoFocusedDocument: z.boolean().default(false),
	directClickWhenEditing: z.boolean().default(true),
});

function isValidColor(colorString: string) {
	// An empty string means the color is automatically calculated
	if (!colorString) return true;

	try {
		Color.parse(colorString);
	} catch {
		return false;
	}

	return true;
}

function isWithinRange(value: number, min: number, max: number) {
	return value >= min && value <= max;
}

export type Settings = z.infer<typeof settingsSchema>;
