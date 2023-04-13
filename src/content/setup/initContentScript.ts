import { initKeyboardClicking } from "../actions/keyboardClicking";
import { updateCustomSelectors } from "../hints/selectors";
import observe from "../observe";
import { cacheSettings, getCachedSetting } from "../settings/cacheSettings";
import { watchSettingsChanges } from "../settings/watchSettingsChanges";
import { addUrlToTitle } from "../utils/addUrlToTitle";
import { loadDevtoolsUtils } from "../utils/devtoolsUtils";
import { loadContentScriptContext } from "./contentScriptContext";

export async function initContentScript() {
	watchSettingsChanges();
	loadDevtoolsUtils();
	await loadContentScriptContext();
	await updateCustomSelectors();
	await cacheSettings();
	await addUrlToTitle();
	await observe();
	if (getCachedSetting("keyboardClicking")) initKeyboardClicking();
}
