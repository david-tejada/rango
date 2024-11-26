import { retrieve, store } from "../../common/storage/storage";
import { notify } from "../utils/notify";

export async function toggleTabMarkers() {
	const includeTabMarkers = await retrieve("includeTabMarkers");
	const newIncludeTabMarkers = !includeTabMarkers;
	const newStatus = newIncludeTabMarkers ? "enabled" : "disabled";

	await store("includeTabMarkers", newIncludeTabMarkers);

	await notify(`Tab markers ${newStatus}.`, {
		icon: newStatus,
		toastId: "tabMarkers",
	});
}
