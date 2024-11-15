import type { ActionMap, ActionV1, ActionV2 } from "./Action";

type CommandV1 = {
	version: 1;
	type: "request";
	action: ActionV1;
};

export type CommandV2<T extends keyof ActionMap> = {
	version: 2;
	type: "request";
	action: ActionV2<T>;
};

export type Command = CommandV1 | CommandV2<keyof ActionMap>;
