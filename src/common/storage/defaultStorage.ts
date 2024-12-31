import { type StorageSchema } from "../../typings/StorageSchema";
import { letterLabels } from "../labels";
import { defaultSettings } from "../settings/settings";

export const defaultStorage: StorageSchema = {
	...defaultSettings,
	tabsByRecency: [],
	labelStacks: new Map(),
	tabMarkers: {
		free: letterLabels,
		assigned: new Map(),
	},
} as const;
