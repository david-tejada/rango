import { getTabId } from "../setup/contentScriptContext";
import { settingsSync } from "./settingsSync";

let navigationToggle: boolean | undefined;

export function setNavigationToggle(enable: boolean | undefined) {
	navigationToggle = enable;
}

export function getToggles() {
	const hintsToggleGlobal = settingsSync.get("hintsToggleGlobal");
	const hintsToggleHosts = settingsSync.get("hintsToggleHosts");
	const hintsTogglePaths = settingsSync.get("hintsTogglePaths");
	const hintsToggleTabs = settingsSync.get("hintsToggleTabs");

	const tabSwitch = hintsToggleTabs[getTabId()];
	const hostSwitch = hintsToggleHosts[location.host];
	const pathSwitch = hintsTogglePaths[location.origin + location.pathname];

	return {
		computed:
			navigationToggle ??
			pathSwitch ??
			hostSwitch ??
			tabSwitch ??
			hintsToggleGlobal,
		navigation: navigationToggle,
		path: pathSwitch,
		host: hostSwitch,
		tab: tabSwitch,
		global: hintsToggleGlobal,
	};
}
