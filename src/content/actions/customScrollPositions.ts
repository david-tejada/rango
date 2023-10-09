import { retrieve, store } from "../../common/storage";
import { notify } from "../notify/notify";
import { getMainScrollable, getScrollBehavior } from "./scroll";

export async function storeScrollPosition(name: string) {
	const scrollContainer = getMainScrollable("vertical");

	if (!scrollContainer) {
		await notify(`Unable to find scroll container`, { type: "error" });
		return;
	}

	const { scrollTop } = scrollContainer;

	const scrollPositions = await retrieve("customScrollPositions");
	const scrollPositionsForCurrentPage =
		scrollPositions.get(window.location.href) ?? new Map<string, number>();

	scrollPositionsForCurrentPage.set(name, scrollTop);

	scrollPositions.set(window.location.href, scrollPositionsForCurrentPage);
	await store("customScrollPositions", scrollPositions);

	await notify(`Scroll position "${name}" saved`, { type: "success" });
}

export async function scrollToPosition(name: string) {
	const scrollContainer = getMainScrollable("vertical");

	const scrollPositions = await retrieve("customScrollPositions");
	const scrollPositionsForCurrentPage =
		scrollPositions.get(window.location.href) ?? new Map<string, number>();

	const position = scrollPositionsForCurrentPage.get(name);

	if (!position) {
		await notify(`No scroll position saved for "${name}"`, { type: "error" });
		return;
	}

	scrollContainer?.scrollTo({ top: position, behavior: getScrollBehavior() });
}
