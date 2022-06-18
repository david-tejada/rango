import browser from "webextension-polyfill";
import { displayHintsFromStorable } from "../../common/storable-display-hints";
import { StorableDisplayHints } from "../../typing/types";
import { assertDefined } from "../../typing/typing-utils";

let navigationToggle: boolean | undefined;

export function setNavigationToggle(toggle: boolean) {
	navigationToggle = toggle;
}

export async function shouldDisplayHints(): Promise<boolean> {
	if (navigationToggle !== undefined) {
		return navigationToggle;
	}

	const { displayHints: storableDisplayHints } =
		(await browser.storage.local.get("displayHints")) as Record<
			string,
			StorableDisplayHints
		>;
	assertDefined(storableDisplayHints);
	const displayHints = displayHintsFromStorable(storableDisplayHints);
	const { tabs, hosts, paths } = displayHints;
	const { tabId } = (await browser.runtime.sendMessage({
		type: "getTabId",
	})) as { tabId: number };
	// console.log(JSON.stringify(displayHints, null, 2));
	const tabSwitch = tabs.get(tabId);
	const hostSwitch = hosts.get(window.location.host);
	const pathSwitch = paths.get(
		window.location.origin + window.location.pathname
	);

	console.log({
		tabId,
		globalSwitch: displayHints.global,
		tabSwitch,
		hostSwitch,
		pathSwitch,
	});

	if (pathSwitch !== undefined) {
		return pathSwitch;
	}

	if (hostSwitch !== undefined) {
		return hostSwitch;
	}

	if (tabSwitch !== undefined) {
		return tabSwitch;
	}

	return displayHints.global;
}
