import { initKeyboardClicking } from "../actions/keyboardClicking";
import { updateCustomSelectors } from "../hints/selectors";
import observe from "../observe";
import { getSetting, initSettingsManager } from "../settings/settingsManager";
import { initTitleDecoration } from "../utils/decorateTitle";
import { loadDevtoolsUtils } from "../utils/devtoolsUtils";
import { loadContentScriptContext } from "./contentScriptContext";

export async function initContentScript() {
	loadDevtoolsUtils();
	await loadContentScriptContext();
	await initSettingsManager();
	await updateCustomSelectors();
	await initTitleDecoration();
	await observe();
	if (getSetting("keyboardClicking")) initKeyboardClicking();
}
