import { initKeyboardClicking } from "../actions/keyboardClicking";
import { updateCustomSelectors } from "../hints/selectors";
import observe from "../observe";
import { getSetting, initSettingsManager } from "../settings/settingsManager";
import { initTitleDecoration } from "../utils/decorateTitle";
import { loadDevtoolsUtils } from "../utils/devtoolsUtils";
import { loadContentScriptContext } from "./contentScriptContext";

let initContentScriptPromise: Promise<void> | undefined;

/**
 * Initializes the content script. If the content script is currently being
 * initialized it waits till it's ready. It makes sure that it only runs once
 * and returns a promise that will resolve once the content script is
 * initialized.
 */
export async function initContentScriptOrWait() {
	initContentScriptPromise ||= (async () => {
		loadDevtoolsUtils();
		await loadContentScriptContext();
		await initSettingsManager();
		await updateCustomSelectors();
		await initTitleDecoration();
		await observe();
		if (getSetting("keyboardClicking")) initKeyboardClicking();
	})();

	return initContentScriptPromise;
}
