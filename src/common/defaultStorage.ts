import { type StorageSchema } from "../typings/StorageSchema";
import { letterLabels } from "./labels";
import { defaultSettings } from "./settings";

export const defaultStorage: StorageSchema = {
	...defaultSettings,
	tabsByRecency: new Map(),
	labelStacks: new Map(),
	tabMarkers: {
		free: letterLabels,
		tabIdsToMarkers: new Map(),
		markersToTabIds: new Map(),
	},
} as const;
