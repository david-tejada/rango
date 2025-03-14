import { settings } from "../../common/settings/settings";
import { type ToggleLevel } from "../../typings/Action";
import { sendMessageToAllFrames } from "../messaging/sendMessageToAllFrames";
import { getRequiredCurrentTab } from "../tabs/getCurrentTab";

export async function toggleHintsGlobal() {
	const hintsToggleGlobal = await settings.get("hintsToggleGlobal");
	const newStatus = !hintsToggleGlobal;
	await settings.set("hintsToggleGlobal", newStatus);
	return newStatus;
}

export async function updateHintsToggle(level: ToggleLevel, enable?: boolean) {
	if (level === "everywhere") {
		if (enable === undefined) {
			await settings.remove([
				"hintsToggleGlobal",
				"hintsToggleTabs",
				"hintsToggleHosts",
				"hintsTogglePaths",
			]);
			await sendMessageToAllFrames("updateNavigationToggle", { enable });
		}

		return;
	}

	if (level === "now") {
		await sendMessageToAllFrames("updateNavigationToggle", { enable });
		return;
	}

	if (level === "global") {
		await settings.set("hintsToggleGlobal", enable ?? true);
		return;
	}

	const currentTab = await getRequiredCurrentTab();
	const { host, origin, pathname } = new URL(currentTab.url!);

	if (level === "tab") {
		const hintsToggleTabs = await settings.get("hintsToggleTabs");

		if (enable === undefined) {
			delete hintsToggleTabs[currentTab.id!];
		} else {
			hintsToggleTabs[currentTab.id!] = enable;
		}

		await settings.set("hintsToggleTabs", hintsToggleTabs);
		return;
	}

	if (level === "host") {
		const hintsToggleHosts = await settings.get("hintsToggleHosts");

		if (enable === undefined) {
			delete hintsToggleHosts[host];
		} else {
			hintsToggleHosts[host] = enable;
		}

		await settings.set("hintsToggleHosts", hintsToggleHosts);
		return;
	}

	if (level === "page") {
		const hintsTogglePaths = await settings.get("hintsTogglePaths");
		const path = origin + pathname;

		if (enable === undefined) {
			delete hintsTogglePaths[path];
		} else {
			hintsTogglePaths[path] = enable;
		}

		await settings.set("hintsTogglePaths", hintsTogglePaths);
	}
}
