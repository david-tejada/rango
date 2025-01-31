import { getTabId } from "../setup/contentScriptContext";
import { getSetting } from "./settingsManager";

let navigationToggle: boolean | undefined;

export function setNavigationToggle(enable: boolean | undefined) {
	navigationToggle = enable;
}

export function getToggles() {
	const hintsToggleGlobal = getSetting("hintsToggleGlobal");
	const hintsToggleHosts = getSetting("hintsToggleHosts");
	const hintsTogglePaths = getSetting("hintsTogglePaths");
	const hintsToggleTabs = getSetting("hintsToggleTabs");

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
