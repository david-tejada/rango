import type { ActionV1, ActionV2 } from "./Action";

export type CommandV1 = {
	version: 1;
	type: "request";
	action: ActionV1;
};

export type CommandV2 = {
	version: 2;
	type: "request";
	action: ActionV2;
};

export type Command = CommandV1 | CommandV2;
