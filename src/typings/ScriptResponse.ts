import { TalonAction } from "./RequestFromTalon";

export interface ClipboardResponse {
	text: string;
}

export type WindowLocationKeys =
	| "href"
	| "hostname"
	| "host"
	| "origin"
	| "pathname"
	| "port"
	| "protocol";

export type ResponseWithLocation = Partial<Record<WindowLocationKeys, string>>;

export interface ResponseWithTalonAction {
	talonAction: TalonAction;
}

export type ScriptResponse =
	| ClipboardResponse
	| ResponseWithLocation
	| ResponseWithTalonAction
	| boolean;
