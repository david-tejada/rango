import type { Action } from "./Action";

export type Command = {
	version: 1;
	type: "request";
	action: Action;
};
