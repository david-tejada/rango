import { Intersector, HintedIntersector } from "../../typings/Intersector";
import { containerIsScrolling } from "../utils/containerIsScrolling";

export function shouldDisplayHint(intersector: Intersector): boolean {
	// When we are scrolling the whole page we need to hide the hints only for those
	// elements that don't scroll with the page
	if (
		intersector.scrollContainer !== document.body &&
		intersector.scrollContainer !== document.documentElement &&
		containerIsScrolling(document)
	) {
		return false;
	}

	// When we scroll a particular container and not the whole page we hide the
	// hints in that container while scrolling
	if (
		intersector.scrollContainer &&
		containerIsScrolling(intersector.scrollContainer) &&
		intersector.scrollContainer !== document.body &&
		intersector.scrollContainer !== document.documentElement
	) {
		return false;
	}

	return true;
}

export function shouldPositionHint(intersector: HintedIntersector): boolean {
	// If the whole page is scrolling don't reposition the hint.
	// We don't want to hide the hints that scroll with the page and the rest will be hidden
	if (containerIsScrolling(document)) {
		return false;
	}

	// If the container of the hint is scrolling don't reposition the hint (as it will be hidden)
	if (
		intersector.scrollContainer &&
		containerIsScrolling(intersector.scrollContainer)
	) {
		return false;
	}

	return true;
}
