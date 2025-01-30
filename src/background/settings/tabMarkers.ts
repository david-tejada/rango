import { settings } from "../../common/settings/settingsNew";
import { notify } from "../utils/notify";

export async function toggleTabMarkers() {
	const includeTabMarkers = await settings.get("includeTabMarkers");
	const newIncludeTabMarkers = !includeTabMarkers;
	const newStatus = newIncludeTabMarkers ? "enabled" : "disabled";

	await settings.set("includeTabMarkers", newIncludeTabMarkers);

	await notify[newStatus](`Tab markers ${newStatus}.`, "tabMarkers");
}
