import { z } from "zod";

const zCustomSelector = z.object({
	pattern: z.string(),
	type: z.enum(["include", "exclude"]),
	selector: z.string(),
});

export type CustomSelector = z.infer<typeof zCustomSelector>;

const zLabelStack = z.object({
	free: z.array(z.string()),
	assigned: z.map(z.string(), z.number()),
});

export type LabelStack = z.infer<typeof zLabelStack>;

const zTabMarkers = z.object({
	free: z.array(z.string()),
	assigned: z.map(z.number(), z.string()),
});

export const zStorageSchema = z.object({
	// Hint style
	hintUppercaseLetters: z.boolean(),
	hintFontFamily: z.string(),
	hintFontSize: z.number(),
	hintWeight: z.enum(["auto", "normal", "bold"]),
	hintBackgroundColor: z.string(),
	hintBackgroundOpacity: z.number(),
	hintFontColor: z.string(),
	hintMinimumContrastRatio: z.number(),
	hintBorderWidth: z.number(),
	hintBorderRadius: z.number(),

	// Hint characters
	includeSingleLetterHints: z.boolean(),
	useNumberHints: z.boolean(),
	hintsToExclude: z.string(),

	// Hintable area
	viewportMargin: z.number(),

	// Scroll
	scrollBehavior: z.enum(["auto", "smooth", "instant"]),

	// Toggle
	hintsToggleGlobal: z.boolean(),
	hintsToggleHosts: z.map(z.string(), z.boolean()),
	hintsTogglePaths: z.map(z.string(), z.boolean()),
	hintsToggleTabs: z.map(z.number(), z.boolean()),

	// Always compute hintables
	alwaysComputeHintables: z.boolean(),

	// Notifications
	enableNotifications: z.boolean(),
	notifyWhenTogglingHints: z.boolean(),
	toastPosition: z.enum([
		"top-right",
		"top-center",
		"top-left",
		"bottom-right",
		"bottom-center",
		"bottom-left",
	]),
	toastTransition: z.enum(["slide", "flip", "zoom", "bounce"]),
	toastDuration: z.number(),

	// Other settings
	urlInTitle: z.boolean(),
	includeTabMarkers: z.boolean(),
	hideTabMarkersWithGlobalHintsOff: z.boolean(),
	uppercaseTabMarkers: z.boolean(),
	keyboardClicking: z.boolean(),
	keysToExclude: z.array(z.tuple([z.string(), z.string()])),
	customSelectors: z.array(zCustomSelector),
	customScrollPositions: z.map(z.string(), z.map(z.string(), z.number())),
	references: z.map(z.string(), z.map(z.string(), z.string())),
	showWhatsNewPageOnUpdate: z.boolean(),
	newTabPosition: z.enum(["relatedAfterCurrent", "afterCurrent", "atEnd"]),
	hasSeenSettingsPage: z.boolean(),
	directClickWithNoFocusedDocument: z.boolean(),
	directClickWhenEditing: z.boolean(),

	// Other data
	tabsByRecency: z.array(z.number()).catch([]), // This used to be a map.
	labelStacks: z.map(z.number(), zLabelStack),
	tabMarkers: zTabMarkers,
	showWhatsNewPageNextStartup: z.boolean(),
});

export type StorageSchema = z.infer<typeof zStorageSchema>;
