import Fuse from "fuse.js";
import { store } from "../../common/storage/storage";
import { notify } from "../feedback/notify";
import { getSetting } from "../settings/settingsManager";
import { getMainScrollable, getScrollBehavior } from "./scroll";

export async function storeScrollPosition(name: string) {
	const scrollContainer = getMainScrollable("vertical");

	if (!scrollContainer) {
		await notify(`Unable to find scroll container`, { type: "error" });
		return;
	}

	const { scrollTop } = scrollContainer;

	const scrollPositions = getSetting("customScrollPositions");
	const scrollPositionsForCurrentPage =
		scrollPositions.get(
			globalThis.location.origin + globalThis.location.pathname
		) ?? new Map<string, number>();

	scrollPositionsForCurrentPage.set(name, scrollTop);

	scrollPositions.set(
		globalThis.location.origin + globalThis.location.pathname,
		scrollPositionsForCurrentPage
	);
	await store("customScrollPositions", scrollPositions);

	await notify(`Scroll position "${name}" saved`, { type: "success" });
}

export async function scrollToPosition(name: string) {
	const scrollContainer = getMainScrollable("vertical");

	const scrollPositions = getSetting("customScrollPositions");
	const scrollPositionsForCurrentPage =
		scrollPositions.get(
			globalThis.location.origin + globalThis.location.pathname
		) ?? new Map<string, number>();

	const scrollPositionsArray = [...scrollPositionsForCurrentPage].map(
		([name, number]) => ({ name, number })
	);

	const fuse = new Fuse(scrollPositionsArray, {
		keys: ["name"],
	});

	const results = fuse.search(name);
	const position = results[0]?.item.number;

	if (!position) {
		await notify(`No scroll position matching "${name}"`, { type: "error" });
		return;
	}

	scrollContainer?.scrollTo({ top: position, behavior: getScrollBehavior() });
}
