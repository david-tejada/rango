import browser from "webextension-polyfill";
import { ScriptContext } from "../types/types";

export async function getScriptEnvironment(): Promise<ScriptContext> {
	return browser.runtime.sendMessage({
		type: "request",
		action: {
			type: "getScriptContext",
		},
	}) as Promise<ScriptContext>;
}
