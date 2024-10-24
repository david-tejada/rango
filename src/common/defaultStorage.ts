import { type StorageSchema } from "../typings/StorageSchema";
import { letterHints } from "./allHints";
import { defaultSettings } from "./settings";

export const defaultStorage: StorageSchema = {
	...defaultSettings,
	tabsByRecency: new Map(),
	hintStacks: new Map(),
	tabMarkers: {
		free: letterHints,
		tabIdsToMarkers: new Map(),
		markersToTabIds: new Map(),
	},
} as const;
