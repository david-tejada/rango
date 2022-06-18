import {
	displayHintsFromStorable,
	displayHintsToStorable,
} from "../common/storable-display-hints";
import { getStored, setStored } from "../lib/storage";
import { ResponseWithLocation, StorableDisplayHints } from "../typing/types";
import { assertDefined } from "../typing/typing-utils";
import {
	getActiveTab,
	sendRequestToActiveTab,
	sendRequestToAllTabs,
} from "./tabs-messaging";

export async function toggleHints(level: string, enable?: boolean) {
	const storableDisplayHints = (await getStored(
		"displayHints"
	)) as StorableDisplayHints;
	const displayHints = displayHintsFromStorable(storableDisplayHints);
	const activeTab = await getActiveTab();
	assertDefined(activeTab);
	assertDefined(activeTab.id);
	const { host, origin, pathname } = (await sendRequestToActiveTab({
		type: "getLocation",
	})) as ResponseWithLocation;

	switch (level) {
		case "all":
			if (enable === undefined) {
				displayHints.global = true;
				displayHints.tabs = new Map();
				displayHints.hosts = new Map();
				displayHints.paths = new Map();
			}
			break;

		case "navigation":
			assertDefined(enable);
			const requestType = enable
				? "enableHintsNavigation"
				: "disableHintsNavigation";
			await sendRequestToActiveTab({
				type: requestType,
			});
			break;

		case "global":
			if (enable !== undefined) {
				displayHints.global = enable;
			}

			break;

		case "tab":
			if (activeTab?.id) {
				if (enable === undefined) {
					displayHints.tabs.delete(activeTab.id);
				} else {
					displayHints.tabs.set(activeTab.id, enable);
				}
			}

			break;

		case "host":
			if (host) {
				if (enable === undefined) {
					displayHints.hosts.delete(host);
				} else {
					displayHints.hosts.set(host, enable);
				}
			}

			break;

		case "path":
			if (origin && pathname) {
				if (enable === undefined) {
					displayHints.paths.delete(origin + pathname);
				} else {
					displayHints.paths.set(origin + pathname, enable);
				}
			}

			break;

		default:
			break;
	}

	await setStored({ displayHints: displayHintsToStorable(displayHints) });
	await sendRequestToAllTabs({ type: "fullHintsUpdate" });
}
