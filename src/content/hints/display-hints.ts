import browser from "webextension-polyfill";
import { Intersector } from "../../typing/types";
import { elementIsObscured } from "../utils/element-visibility";
import { positionHint } from "./position-hints";
import { applyInitialStyles } from "./styles";
import { getOption } from "../options/options";
import {
	initStack,
	claimHints,
	releaseHints,
	releaseOrphanHints,
} from "./hints-requests";
import { intersectors, removedIntersectorsHints } from "../intersectors";

let hintsWillUpdate = false;
let hintsAreUpdating = false;

browser.storage.onChanged.addListener(async (changes) => {
	if ("showHints" in changes) {
		await triggerHintsUpdate(true);
	}
});

function hiddenClickableNeedsRemoved(intersector: Intersector) {
	return (
		(!intersector.isVisible || elementIsObscured(intersector.element)) &&
		intersector.clickableType &&
		intersector.hintText
	);
}

function inViewClickableMissingHint(intersector: Intersector) {
	return (
		intersector.isVisible &&
		!elementIsObscured(intersector.element) &&
		intersector.clickableType &&
		!intersector.hintText
	);
}

function inViewClickablePossessesHint(intersector: Intersector) {
	return (
		intersector.isVisible &&
		!elementIsObscured(intersector.element) &&
		intersector.clickableType &&
		intersector.hintText
	);
}

function getHintsContainer(): HTMLElement {
	let container = document.querySelector("#rango-hints-container");
	if (!container) {
		container = document.createElement("div");
		container.id = "rango-hints-container";
		document.body.append(container);
	}

	return container as HTMLElement;
}

async function updateHints() {
	hintsAreUpdating = true;
	const hintsContainer = getHintsContainer();

	const toBeRemoved: Intersector[] = [];
	const toAddHint: Intersector[] = [];
	const toRefresh: Intersector[] = [];

	for (const intersector of intersectors) {
		if (hiddenClickableNeedsRemoved(intersector)) {
			toBeRemoved.push(intersector);
		} else if (inViewClickableMissingHint(intersector)) {
			toAddHint.push(intersector);
		} else if (inViewClickablePossessesHint(intersector)) {
			toRefresh.push(intersector);
		}
	}

	const hintsToRelease = toBeRemoved.map((intersector) => intersector.hintText);
	await releaseHints([
		...hintsToRelease,
		...removedIntersectorsHints,
	] as string[]);
	removedIntersectorsHints.clear();

	const claimedHints = await claimHints(toAddHint.length);

	for (const intersector of toBeRemoved) {
		intersector.hintElement?.remove();
		intersector.hintElement = undefined;
		intersector.hintText = undefined;
	}

	for (const intersector of toAddHint) {
		intersector.hintElement = document.createElement("div");
		intersector.hintText = claimedHints.pop();
		intersector.hintElement.textContent = intersector.hintText ?? "";

		// If there are no more available hints to markup the page, don't
		// append the element.
		if (intersector.hintText) {
			applyInitialStyles(intersector);
			hintsContainer.append(intersector.hintElement as Node);
			positionHint(intersector);
		}
	}

	for (const intersector of toRefresh) {
		applyInitialStyles(intersector);
		positionHint(intersector);
	}

	// Hints cleanup
	const hintElements = hintsContainer.querySelectorAll(".rango-hint");
	const hints = intersectors
		.filter((intersector) => intersector.hintText)
		.map((intersector) => intersector.hintText) as string[];
	const hintsSet = new Set(hints);
	for (const hintElement of hintElements) {
		if (!hintsSet.has(hintElement.textContent!)) {
			hintElement.remove();
		}
	}

	await releaseOrphanHints(hints);

	if (process.env["NODE_ENV"] !== "production") {
		const hintedIntersectors = intersectors
			.filter((intersector) => intersector.hintText)
			.sort(
				(a, b) =>
					a.hintText!.length - b.hintText!.length ||
					a.hintText!.localeCompare(b.hintText!)
			);
		console.log("intersectors:", intersectors);
		console.log("hinted intersectors:", hintedIntersectors);
	}

	hintsAreUpdating = false;
	hintsWillUpdate = false;
}

export async function triggerHintsUpdate(fullRefresh = false) {
	if (fullRefresh) {
		document.querySelector("#rango-hints-container")?.remove();
		await initStack();
		for (const intersector of intersectors) {
			intersector.hintElement?.remove();
			intersector.hintElement = undefined;
			intersector.hintText = undefined;
		}
	}

	// We set a timeout in order to avoid updating the hints too often, for example,
	// when there are multiple mutations or intersections happening
	const showHints = getOption("showHints");
	if (showHints && hintsAreUpdating) {
		setTimeout(triggerHintsUpdate, 300);
	}

	if (showHints && !hintsWillUpdate && !hintsAreUpdating) {
		hintsWillUpdate = true;
		setTimeout(updateHints, 50);
	}
}
