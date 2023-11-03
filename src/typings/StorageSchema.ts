import { z } from "zod";

const zCustomSelectorsForPattern = z.object({
	include: z.array(z.string()),
	exclude: z.array(z.string()),
});

export type CustomSelectorsForPattern = z.infer<
	typeof zCustomSelectorsForPattern
>;

const zHintsStack = z.object({
	free: z.array(z.string()),
	assigned: z.map(z.string(), z.number()),
});

export type HintsStack = z.infer<typeof zHintsStack>;

const zTabMarkers = z.object({
	free: z.array(z.string()),
	tabIdsToMarkers: z.map(z.number(), z.string()),
	markersToTabIds: z.map(z.string(), z.number()),
});

export type TabMarkers = z.infer<typeof zTabMarkers>;

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

	// Notifications
	enableNotifications: z.boolean(),
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
	uppercaseTabMarkers: z.boolean(),
	keyboardClicking: z.boolean(),
	customSelectors: z.map(z.string(), zCustomSelectorsForPattern),
	customScrollPositions: z.map(z.string(), z.map(z.string(), z.number())),
	references: z.map(z.string(), z.map(z.string(), z.string())),
	showWhatsNewPageOnUpdate: z.boolean(),
	newTabPosition: z.enum(["relatedAfterCurrent", "afterCurrent", "atEnd"]),
	hasSeenSettingsPage: z.boolean(),
	directClickWithNoFocusedDocument: z.boolean(),
	directClickWhenEditing: z.boolean(),

	// Other data
	tabsByRecency: z.map(z.number(), z.array(z.number())),
	hintsStacks: z.map(z.number(), zHintsStack),
	tabMarkers: zTabMarkers,
});

export type StorageSchema = z.infer<typeof zStorageSchema>;
