import { settings } from "../../common/settings/settingsNew";
import { type ToggleLevel } from "../../typings/Action";
import { sendMessage } from "../messaging/sendMessage";
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
			await sendMessage("updateNavigationToggle", { enable });
		}

		return;
	}

	if (level === "now") {
		await sendMessage("updateNavigationToggle", { enable });
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
			hintsToggleTabs.delete(currentTab.id!);
		} else {
			hintsToggleTabs.set(currentTab.id!, enable);
		}

		await settings.set("hintsToggleTabs", hintsToggleTabs);
		return;
	}

	if (level === "host") {
		const hintsToggleHosts = await settings.get("hintsToggleHosts");

		if (enable === undefined) {
			hintsToggleHosts.delete(host);
		} else {
			hintsToggleHosts.set(host, enable);
		}

		await settings.set("hintsToggleHosts", hintsToggleHosts);
		return;
	}

	if (level === "page") {
		const hintsTogglePaths = await settings.get("hintsTogglePaths");

		if (enable === undefined) {
			hintsTogglePaths.delete(origin + pathname);
		} else {
			hintsTogglePaths.set(origin + pathname, enable);
		}

		await settings.set("hintsTogglePaths", hintsTogglePaths);
	}
}
