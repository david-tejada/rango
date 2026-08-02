import type { CommandAction } from "../shared/protocol";

/**
 * Maps rango-cli verbs to Rango's existing `ActionMap` command names — the
 * same commands the clipboard/Talon transport already dispatches through
 * `handleCommand()`. The MVP intentionally reuses `enableHints({level:"now"})`
 * + `refreshHints()` (the existing rendering-coupled overlay) rather than
 * adding a headless hint-computation path.
 */
export const showHintsAction: CommandAction = {
	name: "enableHints",
	level: "now",
};

export const refreshHintsAction: CommandAction = { name: "refreshHints" };

export const hideHintsAction: CommandAction = {
	name: "disableHints",
	level: "now",
};

export function clickHintAction(label: string): CommandAction {
	if (!label) throw new Error("Usage: rango click <hint-label>");

	return {
		name: "clickElement",
		target: {
			type: "primitive",
			mark: { type: "elementHint", value: label.toUpperCase() },
		},
	};
}
