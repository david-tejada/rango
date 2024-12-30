import { retrieve, store } from "../../common/storage/storage";
import { type ToggleLevel } from "../../typings/Action";
import { sendMessage } from "../messaging/backgroundMessageBroker";
import { getRequiredCurrentTab } from "../tabs/getCurrentTab";

export async function toggleHintsGlobal() {
	const hintsToggleGlobal = await retrieve("hintsToggleGlobal");
	const newStatus = !hintsToggleGlobal;
	await store("hintsToggleGlobal", newStatus);
	return newStatus;
}

export async function updateHintsToggle(level: ToggleLevel, enable?: boolean) {
	if (level === "everywhere") {
		if (enable === undefined) {
			await store("hintsToggleGlobal", true);
			await store("hintsToggleTabs", new Map());
			await store("hintsToggleHosts", new Map());
			await store("hintsTogglePaths", new Map());
			await sendMessage("updateNavigationToggle", { enable });
		}

		return;
	}

	if (level === "now") {
		await sendMessage("updateNavigationToggle", { enable });
		return;
	}

	if (level === "global") {
		await store("hintsToggleGlobal", enable ?? true);
		return;
	}

	const currentTab = await getRequiredCurrentTab();
	const { host, origin, pathname } = new URL(currentTab.url!);

	if (level === "tab") {
		const hintsToggleTabs = await retrieve("hintsToggleTabs");

		if (enable === undefined) {
			hintsToggleTabs.delete(currentTab.id!);
		} else {
			hintsToggleTabs.set(currentTab.id!, enable);
		}

		await store("hintsToggleTabs", hintsToggleTabs);
		return;
	}

	if (level === "host") {
		const hintsToggleHosts = await retrieve("hintsToggleHosts");

		if (enable === undefined) {
			hintsToggleHosts.delete(host);
		} else {
			hintsToggleHosts.set(host, enable);
		}

		await store("hintsToggleHosts", hintsToggleHosts);
		return;
	}

	if (level === "page") {
		const hintsTogglePaths = await retrieve("hintsTogglePaths");

		if (enable === undefined) {
			hintsTogglePaths.delete(origin + pathname);
		} else {
			hintsTogglePaths.set(origin + pathname, enable);
		}

		await store("hintsTogglePaths", hintsTogglePaths);
	}
}
