import { initKeyboardClicking } from "../actions/keyboardClicking";
import { updateCustomSelectors } from "../hints/selectors";
import observe from "../observe";
import { getSetting, initSettingsManager } from "../settings/settingsManager";
import { loadContentScriptContext } from "./contentScriptContext";
import { updateTitleDecorations } from "./decorateTitle";
import { loadDevtoolsUtils } from "./devtoolsUtils";

/**
 * Initializes the content script.
 */
export async function initContentScript() {
	loadDevtoolsUtils();
	await loadContentScriptContext();
	await initSettingsManager();
	updateCustomSelectors();
	await updateTitleDecorations();
	await observe();
	if (getSetting("keyboardClicking")) initKeyboardClicking();
}
