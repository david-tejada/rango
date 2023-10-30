import { allHints } from "../background/utils/allHints";
import { StorageSchema } from "../typings/StorageSchema";
import { defaultSettings } from "./settings";

export const defaultStorage: StorageSchema = {
	...defaultSettings,
	tabsByRecency: new Map(),
	hintsStacks: new Map(),
	tabMarkers: {
		free: allHints,
		tabIdsToMarkers: new Map(),
		markersToTabIds: new Map(),
	},
} as const;
