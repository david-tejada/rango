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
	tabIdsToMarkers: z.(z.number(), z.string()),
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
	switchedToSyncStorage: z.boolean(),
	showWhatsNewPageOnUpdate: z.boolean(),
	newTabPosition: z.enum(["relatedAfterCurrent", "afterCurrent", "atEnd"]),
	hasSeenSettingsPage: z.boolean(),
	directClickWithNoFocusedDocument: z.boolean(),
	directClickWhenEditing: z.boolean(),

	// Other data
	tabsByRecency: z.map(z.number(), z.array(z.number())),
	hintsStacks: z.map(z.number(), zHintsStack),
	tabMarkers: zTabMarkers,

	// Legacy
	hintsToggle: z.object({
		global: z.boolean(),
		tabs: z.array(z.tuple([z.number(), z.boolean()])),
		hosts: z.array(z.tuple([z.string(), z.boolean()])),
		paths: z.array(z.tuple([z.string(), z.boolean()])),
	}),
});

export type StorageSchema = z.infer<typeof zStorageSchema>;
