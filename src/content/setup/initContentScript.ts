import { initKeyboardClicking } from "../actions/keyboardClicking";
import { updateCustomSelectors } from "../hints/selectors";
import observe from "../observe";
import { settingsSync } from "../settings/settingsSync";
import { loadContentScriptContext } from "./contentScriptContext";
import { updateTitleDecorations } from "./decorateTitle";
import { loadDevtoolsUtils } from "./devtoolsUtils";

/**
 * Initializes the content script.
 */
export async function initContentScript() {
	loadDevtoolsUtils();
	await loadContentScriptContext();
	await settingsSync.initialize();
	updateCustomSelectors();
	await updateTitleDecorations();
	await observe();
	if (settingsSync.get("keyboardClicking")) initKeyboardClicking();
}
